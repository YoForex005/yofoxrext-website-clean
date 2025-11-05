'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import type {
  TypingEvent,
  NewMessageEvent,
  MessageReadEvent,
  UserOnlineEvent,
  ReactionEvent,
  ParticipantEvent,
} from '@/types/messaging';

interface UseMessagingSocketOptions {
  userId?: string;
  onNewMessage?: (event: NewMessageEvent) => void;
  onMessageRead?: (event: MessageReadEvent) => void;
  onTyping?: (event: TypingEvent) => void;
  onUserOnline?: (event: UserOnlineEvent) => void;
  onUserOffline?: (event: UserOnlineEvent) => void;
  onReactionAdded?: (event: ReactionEvent) => void;
  onReactionRemoved?: (event: ReactionEvent) => void;
  onParticipantAdded?: (event: ParticipantEvent) => void;
  onParticipantRemoved?: (event: ParticipantEvent) => void;
}

export function useMessagingSocket(options: UseMessagingSocketOptions = {}) {
  const {
    userId,
    onNewMessage,
    onMessageRead,
    onTyping,
    onUserOnline,
    onUserOffline,
    onReactionAdded,
    onReactionRemoved,
    onParticipantAdded,
    onParticipantRemoved,
  } = options;

  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const currentConversationRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onlineUsersRef = useRef<Set<string>>(new Set());

  // Initialize socket connection
  useEffect(() => {
    if (!userId) return;

    // Connect to the same origin (Next.js serves everything on port 5000)
    const apiUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : 'http://localhost:5000';

    const socket: Socket = io(apiUrl, {
      path: '/ws/dashboard',
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Messaging WS] Connected to WebSocket');
      socket.emit('join', userId);
    });

    socket.on('disconnect', () => {
      console.log('[Messaging WS] Disconnected from WebSocket');
    });

    socket.on('error', (error) => {
      console.error('[Messaging WS] WebSocket error:', error);
    });

    // Handle new message
    socket.on('new-message', (event: NewMessageEvent) => {
      console.log('[Messaging WS] New message received:', event);
      
      // Invalidate conversations to update last message and unread count
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      // If this message is in the current conversation, invalidate it
      if (event.conversationId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/conversations', event.conversationId],
        });
      }

      onNewMessage?.(event);
    });

    // Handle message read receipt
    socket.on('message-read', (event: MessageReadEvent) => {
      console.log('[Messaging WS] Message read:', event);
      
      // Update conversations to reflect read status
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      onMessageRead?.(event);
    });

    // Handle typing indicator
    socket.on('typing', (event: TypingEvent) => {
      onTyping?.(event);
    });

    // Handle user online status
    socket.on('user-online', (event: UserOnlineEvent) => {
      onlineUsersRef.current.add(event.userId);
      onUserOnline?.(event);
    });

    socket.on('user-offline', (event: UserOnlineEvent) => {
      onlineUsersRef.current.delete(event.userId);
      onUserOffline?.(event);
    });

    // Handle reactions
    socket.on('reaction-added', (event: ReactionEvent) => {
      console.log('[Messaging WS] Reaction added:', event);
      queryClient.invalidateQueries({ 
        queryKey: ['/api/messages', event.messageId, 'reactions'],
      });
      onReactionAdded?.(event);
    });

    socket.on('reaction-removed', (event: any) => {
      console.log('[Messaging WS] Reaction removed:', event);
      queryClient.invalidateQueries({ 
        queryKey: ['/api/messages', event.messageId, 'reactions'],
      });
      onReactionRemoved?.(event);
    });

    // Handle participant events
    socket.on('participant-added', (event: ParticipantEvent) => {
      console.log('[Messaging WS] Participant added:', event);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      onParticipantAdded?.(event);
    });

    socket.on('participant-removed', (event: ParticipantEvent) => {
      console.log('[Messaging WS] Participant removed:', event);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      onParticipantRemoved?.(event);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, queryClient, onNewMessage, onMessageRead, onTyping, onUserOnline, onUserOffline, onReactionAdded, onReactionRemoved, onParticipantAdded, onParticipantRemoved]);

  // Join conversation room
  const joinConversation = useCallback((conversationId: string) => {
    if (!socketRef.current || !userId) return;

    // Leave previous conversation
    if (currentConversationRef.current) {
      socketRef.current.emit('leave-conversation', {
        conversationId: currentConversationRef.current,
        userId,
      });
    }

    // Join new conversation
    socketRef.current.emit('join-conversation', {
      conversationId,
      userId,
    });

    currentConversationRef.current = conversationId;
  }, [userId]);

  // Leave conversation room
  const leaveConversation = useCallback(() => {
    if (!socketRef.current || !userId || !currentConversationRef.current) return;

    socketRef.current.emit('leave-conversation', {
      conversationId: currentConversationRef.current,
      userId,
    });

    currentConversationRef.current = null;
  }, [userId]);

  // Emit typing start
  const startTyping = useCallback((conversationId: string) => {
    if (!socketRef.current || !userId) return;

    socketRef.current.emit('typing-start', {
      conversationId,
      userId,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 3000);
  }, [userId]);

  // Emit typing stop
  const stopTyping = useCallback((conversationId: string) => {
    if (!socketRef.current || !userId) return;

    socketRef.current.emit('typing-stop', {
      conversationId,
      userId,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [userId]);

  // Check if user is online
  const isUserOnline = useCallback((userId: string) => {
    return onlineUsersRef.current.has(userId);
  }, []);

  return {
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    isUserOnline,
    socket: socketRef.current,
  };
}
