import { Server as SocketIOServer, Namespace } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;
let dashboardNamespace: Namespace | null = null;
let adminNamespace: Namespace | null = null;

export function initializeDashboardWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // ===== CLIENT NAMESPACE: /ws/dashboard =====
  dashboardNamespace = io.of('/ws/dashboard');
  
  dashboardNamespace.on('connection', (socket) => {
    console.log(`[Dashboard WS] Client connected: ${socket.id}`);
    let currentUserId: string | null = null;

    // Join user-specific room
    socket.on('join', (userId: string) => {
      currentUserId = userId;
      socket.join(`user:${userId}`);
      console.log(`[Dashboard WS] User ${userId} joined room`);
      
      // Emit user-online event to all conversation participants
      emitUserOnlineStatus(userId, true);
    });

    // Join conversation room
    socket.on('join-conversation', (data: { conversationId: string; userId: string }) => {
      const { conversationId, userId } = data;
      socket.join(`conversation:${conversationId}`);
      console.log(`[Messaging WS] User ${userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave-conversation', (data: { conversationId: string; userId: string }) => {
      const { conversationId, userId } = data;
      socket.leave(`conversation:${conversationId}`);
      console.log(`[Messaging WS] User ${userId} left conversation ${conversationId}`);
    });

    // Typing start event
    socket.on('typing-start', (data: { conversationId: string; userId: string }) => {
      const { conversationId, userId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId,
        isTyping: true,
      });
    });

    // Typing stop event
    socket.on('typing-stop', (data: { conversationId: string; userId: string }) => {
      const { conversationId, userId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Dashboard WS] Client disconnected: ${socket.id}`);
      
      // Emit user-offline event to all conversation participants
      if (currentUserId) {
        emitUserOnlineStatus(currentUserId, false);
      }
    });
  });

  // ===== ADMIN NAMESPACE: /ws/admin =====
  adminNamespace = io.of('/ws/admin');
  
  // Authentication middleware for admin namespace
  adminNamespace.use(async (socket, next) => {
    const userId = socket.handshake.auth.userId;
    const userRole = socket.handshake.auth.userRole;
    
    if (!userId) {
      console.warn('[ADMIN WS] Connection rejected: No userId provided');
      return next(new Error('Authentication required'));
    }
    
    if (userRole !== 'admin' && userRole !== 'superadmin' && userRole !== 'moderator') {
      console.warn(`[ADMIN WS] Connection rejected: User ${userId} has insufficient permissions (role: ${userRole})`);
      return next(new Error('Admin access required'));
    }
    
    socket.data.userId = userId;
    socket.data.userRole = userRole;
    next();
  });
  
  adminNamespace.on('connection', (socket) => {
    console.log(`[ADMIN WS] Admin ${socket.data.userId} (${socket.data.userRole}) connected`);
    
    // Join admin monitoring room
    socket.join('admin-monitor');
    
    // Join role-specific channels
    if (socket.data.userRole === 'superadmin') {
      socket.join('admin-finance');
      socket.join('admin-moderation');
      socket.join('admin-security');
    } else if (socket.data.userRole === 'admin') {
      socket.join('admin-moderation');
    }
    
    socket.on('disconnect', () => {
      console.log(`[ADMIN WS] Admin ${socket.data.userId} disconnected`);
    });
  });

  return io;
}

// ===== CLIENT NAMESPACE EMITTERS =====

// Emit live earnings update
export function emitEarningsUpdate(userId: string, amount: number, source: string) {
  if (!dashboardNamespace) return;
  dashboardNamespace.to(`user:${userId}`).emit('earnings:update', { amount, source, timestamp: new Date() });
}

// Emit vault unlock notification
export function emitVaultUnlock(userId: string, amount: number) {
  if (!dashboardNamespace) return;
  dashboardNamespace.to(`user:${userId}`).emit('vault:unlock', { amount, timestamp: new Date() });
}

// Emit badge unlock notification
export function emitBadgeUnlock(userId: string, badge: any) {
  if (!dashboardNamespace) return;
  dashboardNamespace.to(`user:${userId}`).emit('badge:unlock', { badge, timestamp: new Date() });
}

// ===== SWEETS SYSTEM WEBSOCKET EVENTS =====

// Emit XP awarded notification
export function emitSweetsXpAwarded(
  userId: string,
  data: {
    xpAwarded: number;
    newTotalXp: number;
    rankChanged: boolean;
    newRank?: any;
    newlyUnlockedFeatures?: any[];
  }
) {
  if (!dashboardNamespace) return;
  dashboardNamespace.to(`user:${userId}`).emit('sweets:xp-awarded', {
    userId,
    ...data,
    timestamp: new Date(),
  });
  console.log(`[Sweets WS] XP awarded to user ${userId}: +${data.xpAwarded} XP`);
}

// Emit balance update notification
export function emitSweetsBalanceUpdated(
  userId: string,
  data: {
    newBalance: number;
    change: number;
  }
) {
  if (!dashboardNamespace) return;
  dashboardNamespace.to(`user:${userId}`).emit('sweets:balance-updated', {
    userId,
    ...data,
    timestamp: new Date(),
  });
  console.log(`[Sweets WS] Balance updated for user ${userId}: ${data.change > 0 ? '+' : ''}${data.change} (new: ${data.newBalance})`);
}

// ===== MESSAGING WEBSOCKET EVENTS =====

// Emit new message to all conversation participants
export function emitNewMessage(conversationId: string, message: any) {
  if (!dashboardNamespace) return;
  dashboardNamespace.to(`conversation:${conversationId}`).emit('new-message', {
    conversationId,
    message,
    timestamp: new Date(),
  });
}

// Emit message read receipt to message sender
export function emitMessageRead(senderId: string, messageId: string, userId: string) {
  if (!dashboardNamespace) return;
  dashboardNamespace.to(`user:${senderId}`).emit('message-read', {
    messageId,
    userId,
    readAt: new Date(),
  });
}

// Emit user online/offline status
export function emitUserOnlineStatus(userId: string, online: boolean) {
  if (!dashboardNamespace) return;
  dashboardNamespace.emit(online ? 'user-online' : 'user-offline', {
    userId,
    online,
    timestamp: new Date(),
  });
}

// Emit reaction added to conversation participants
export function emitReactionAdded(conversationId: string, messageId: string, reaction: any) {
  if (!dashboardNamespace) return;
  dashboardNamespace.to(`conversation:${conversationId}`).emit('reaction-added', {
    messageId,
    reaction,
    timestamp: new Date(),
  });
}

// Emit reaction removed to conversation participants
export function emitReactionRemoved(conversationId: string, messageId: string, reactionId: string) {
  if (!dashboardNamespace) return;
  dashboardNamespace.to(`conversation:${conversationId}`).emit('reaction-removed', {
    messageId,
    reactionId,
    timestamp: new Date(),
  });
}

// Emit participant added to conversation
export function emitParticipantAdded(conversationId: string, user: any) {
  if (!dashboardNamespace) return;
  dashboardNamespace.to(`conversation:${conversationId}`).emit('participant-added', {
    conversationId,
    user,
    timestamp: new Date(),
  });
}

// Emit participant removed from conversation
export function emitParticipantRemoved(conversationId: string, userId: string) {
  if (!dashboardNamespace) return;
  dashboardNamespace.to(`conversation:${conversationId}`).emit('participant-removed', {
    conversationId,
    userId,
    timestamp: new Date(),
  });
}

// ===== ADMIN NAMESPACE EMITTERS =====

// Emit events to all admins in monitoring room
export function emitToAdmins(event: string, data: any) {
  if (!adminNamespace) return;
  adminNamespace.to('admin-monitor').emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
  console.log(`[ADMIN WS] Emitted ${event} to admins:`, data);
}

// Emit to specific admin channel (finance, moderation, security)
export function emitToAdminChannel(channel: string, event: string, data: any) {
  if (!adminNamespace) return;
  const roomName = `admin-${channel}`;
  adminNamespace.to(roomName).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
  console.log(`[ADMIN WS] Emitted ${event} to channel ${roomName}:`, data);
}

// Admin event: Sweets transaction
export function emitAdminSweetsTransaction(data: {
  userId: string;
  transactionId: string;
  amount: number;
  trigger: string;
  channel: string;
  newBalance: number;
}) {
  emitToAdmins('admin:sweets-transaction', data);
  
  // High-value transaction alert
  if (Math.abs(data.amount) > 500) {
    emitToAdmins('admin:sweets-alert', {
      severity: 'high',
      type: 'high_value_transaction',
      userId: data.userId,
      amount: data.amount,
      trigger: data.trigger,
    });
  }
}

// Admin event: User registered
export function emitAdminUserRegistered(data: {
  userId: string;
  username: string;
  email: string;
  registrationMethod: string;
}) {
  emitToAdmins('admin:user-registered', data);
}

// Admin event: Content submitted
export function emitAdminContentSubmitted(data: {
  type: 'thread' | 'content' | 'ea';
  contentId: string;
  authorId: string;
  title: string;
  status: string;
}) {
  emitToAdmins('admin:content-submitted', data);
}

// Admin event: Content flagged for moderation
export function emitAdminModerationFlagged(data: {
  contentId: string;
  contentType: string;
  reason: string;
  reporterId: string;
}) {
  emitToAdminChannel('moderation', 'admin:moderation-flagged', data);
}

// Admin event: Support ticket created
export function emitAdminTicketCreated(data: {
  ticketId: string;
  userId: string;
  subject: string;
  priority: string;
}) {
  emitToAdmins('admin:ticket-created', data);
}
