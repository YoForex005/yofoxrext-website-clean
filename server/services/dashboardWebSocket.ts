import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initializeDashboardWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    path: '/ws/dashboard',
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
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

  return io;
}

// Emit live earnings update
export function emitEarningsUpdate(userId: string, amount: number, source: string) {
  if (!io) return;
  io.to(`user:${userId}`).emit('earnings:update', { amount, source, timestamp: new Date() });
}

// Emit vault unlock notification
export function emitVaultUnlock(userId: string, amount: number) {
  if (!io) return;
  io.to(`user:${userId}`).emit('vault:unlock', { amount, timestamp: new Date() });
}

// Emit badge unlock notification
export function emitBadgeUnlock(userId: string, badge: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit('badge:unlock', { badge, timestamp: new Date() });
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
  if (!io) return;
  io.to(`user:${userId}`).emit('sweets:xp-awarded', {
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
  if (!io) return;
  io.to(`user:${userId}`).emit('sweets:balance-updated', {
    userId,
    ...data,
    timestamp: new Date(),
  });
  console.log(`[Sweets WS] Balance updated for user ${userId}: ${data.change > 0 ? '+' : ''}${data.change} (new: ${data.newBalance})`);
}

// ===== MESSAGING WEBSOCKET EVENTS =====

// Emit new message to all conversation participants
export function emitNewMessage(conversationId: string, message: any) {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit('new-message', {
    conversationId,
    message,
    timestamp: new Date(),
  });
}

// Emit message read receipt to message sender
export function emitMessageRead(senderId: string, messageId: string, userId: string) {
  if (!io) return;
  io.to(`user:${senderId}`).emit('message-read', {
    messageId,
    userId,
    readAt: new Date(),
  });
}

// Emit user online/offline status
export function emitUserOnlineStatus(userId: string, online: boolean) {
  if (!io) return;
  io.emit(online ? 'user-online' : 'user-offline', {
    userId,
    online,
    timestamp: new Date(),
  });
}

// Emit reaction added to conversation participants
export function emitReactionAdded(conversationId: string, messageId: string, reaction: any) {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit('reaction-added', {
    messageId,
    reaction,
    timestamp: new Date(),
  });
}

// Emit reaction removed to conversation participants
export function emitReactionRemoved(conversationId: string, messageId: string, reactionId: string) {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit('reaction-removed', {
    messageId,
    reactionId,
    timestamp: new Date(),
  });
}

// Emit participant added to conversation
export function emitParticipantAdded(conversationId: string, user: any) {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit('participant-added', {
    conversationId,
    user,
    timestamp: new Date(),
  });
}

// Emit participant removed from conversation
export function emitParticipantRemoved(conversationId: string, userId: string) {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit('participant-removed', {
    conversationId,
    userId,
    timestamp: new Date(),
  });
}
