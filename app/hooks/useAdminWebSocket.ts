'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AdminEvent {
  event: string;
  data: any;
  timestamp: string;
}

interface UseAdminWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  recentEvents: AdminEvent[];
}

export function useAdminWebSocket(user?: { id: string; role: string } | null): UseAdminWebSocketReturn {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [recentEvents, setRecentEvents] = useState<AdminEvent[]>([]);

  useEffect(() => {
    // Only connect if user is admin, superadmin, or moderator
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'moderator')) {
      return;
    }

    // Connect to the API server for WebSocket (same as client dashboard)
    const apiUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : 'http://localhost:3001';

    // Connect to admin namespace
    const adminSocket: Socket = io(apiUrl, {
      path: '/ws/admin',
      auth: {
        userId: user.id,
        userRole: user.role
      },
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    adminSocket.on('connect', () => {
      console.log('[ADMIN WS] Connected to admin WebSocket namespace');
      setConnected(true);
    });

    adminSocket.on('disconnect', () => {
      console.log('[ADMIN WS] Disconnected from admin WebSocket');
      setConnected(false);
    });

    adminSocket.on('error', (error) => {
      console.error('[ADMIN WS] WebSocket error:', error);
    });

    // Listen for all admin events using onAny
    adminSocket.onAny((event, data) => {
      console.log(`[ADMIN EVENT] ${event}:`, data);
      
      // Add to recent events list
      setRecentEvents(prev => [
        { event, data, timestamp: data.timestamp || new Date().toISOString() },
        ...prev.slice(0, 99) // Keep last 100 events
      ]);

      // Handle specific admin events
      switch (event) {
        case 'admin:sweets-transaction':
          // Invalidate admin transaction queries
          queryClient.invalidateQueries({ queryKey: ['/api/admin/sweets/transactions'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
          break;

        case 'admin:sweets-alert':
          // Show high-priority alerts as toasts
          if (data.severity === 'high') {
            toast.warning(`⚠️ ${data.type}: ${data.amount} Sweets`, {
              description: `User: ${data.userId} | Trigger: ${data.trigger}`,
              duration: 10000,
            });
          }
          break;

        case 'admin:user-registered':
          // Invalidate user management queries
          queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
          
          toast.success(`New user registered: ${data.username}`, {
            description: `Email: ${data.email} | Method: ${data.registrationMethod}`,
          });
          break;

        case 'admin:content-submitted':
          // Invalidate content management queries
          queryClient.invalidateQueries({ queryKey: ['/api/admin/content'] });
          queryClient.invalidateQueries({ queryKey: ['/api/moderation/queue'] });
          
          toast.info(`New ${data.type} submitted: ${data.title}`, {
            description: `Author: ${data.authorId} | Status: ${data.status}`,
          });
          break;

        case 'admin:moderation-flagged':
          // Invalidate moderation queues
          queryClient.invalidateQueries({ queryKey: ['/api/moderation/queue'] });
          queryClient.invalidateQueries({ queryKey: ['/api/moderation/reported'] });
          
          toast.warning(`Content flagged for moderation`, {
            description: `Type: ${data.contentType} | Reason: ${data.reason}`,
            duration: 8000,
          });
          break;

        case 'admin:ticket-created':
          // Invalidate support ticket queries
          queryClient.invalidateQueries({ queryKey: ['/api/admin/support/tickets'] });
          
          toast.info(`New support ticket created`, {
            description: `${data.subject} | Priority: ${data.priority}`,
          });
          break;

        default:
          // Log other admin events
          console.log(`[ADMIN WS] Unhandled event: ${event}`, data);
      }
    });

    setSocket(adminSocket);

    return () => {
      console.log('[ADMIN WS] Cleaning up admin WebSocket connection');
      adminSocket.disconnect();
    };
  }, [user, queryClient]);

  return {
    socket,
    connected,
    recentEvents
  };
}
