import type { User } from "@shared/schema";

// Conversation types
export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: Date;
  createdAt: Date;
  isGroup: boolean;
  groupName?: string;
  groupDescription?: string;
  createdById?: string;
  updatedAt?: Date;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: Date;
  leftAt?: Date | null;
  role: "admin" | "member";
  muted: boolean;
  createdAt: Date;
}

export interface ConversationWithDetails extends Conversation {
  participants: (ConversationParticipant & { user: User })[];
  lastMessage?: Message;
  unreadCount: number;
  otherParticipant?: User;
  isTyping?: boolean;
}

// Message types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  isRead: boolean;
  deliveredAt?: Date | null;
  readAt?: Date | null;
  createdAt: Date;
}

export interface MessageWithDetails extends Message {
  sender: User;
  recipient: User;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  readReceipts: MessageReadReceipt[];
}

// Attachment types
export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  storageUrl?: string | null;
  uploadedById: string;
  virusScanned: boolean;
  scanStatus: "pending" | "clean" | "infected" | "error";
  createdAt: Date;
}

// Reaction types
export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
  user?: User;
}

export interface MessageReactionGroup {
  emoji: string;
  count: number;
  users: User[];
  hasReacted: boolean;
}

// Read receipt types
export interface MessageReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  readAt: Date;
  deliveredAt?: Date | null;
  createdAt: Date;
}

// WebSocket event types
export interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface NewMessageEvent {
  conversationId: string;
  message: MessageWithDetails;
  timestamp: Date;
}

export interface MessageReadEvent {
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface UserOnlineEvent {
  userId: string;
  online: boolean;
  timestamp: Date;
}

export interface ReactionEvent {
  messageId: string;
  reaction: MessageReaction;
  timestamp: Date;
}

export interface ParticipantEvent {
  conversationId: string;
  user?: User;
  userId?: string;
  timestamp: Date;
}

// Search types
export interface MessageSearchResult {
  message: MessageWithDetails;
  conversation: Conversation;
  snippet: string;
}

// Upload types
export interface FileUploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  attachmentId?: string;
}
