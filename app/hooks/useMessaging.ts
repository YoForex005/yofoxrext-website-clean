'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type {
  ConversationWithDetails,
  MessageWithDetails,
  MessageSearchResult,
} from '@/types/messaging';

// ===== QUERY HOOKS =====

/**
 * Fetch all conversations for the current user
 */
export function useConversations() {
  return useQuery<ConversationWithDetails[]>({
    queryKey: ['/api/conversations'],
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

/**
 * Fetch messages for a specific conversation
 */
export function useConversation(conversationId: string | null) {
  return useQuery<MessageWithDetails[]>({
    queryKey: ['/api/conversations', conversationId],
    enabled: !!conversationId,
    staleTime: 10000, // Consider data fresh for 10 seconds
  });
}

/**
 * Search messages across all conversations
 */
export function useSearchMessages(query: string) {
  return useQuery<MessageSearchResult[]>({
    queryKey: ['/api/messages/search', { q: query }],
    enabled: query.length > 2,
    staleTime: 30000,
  });
}

/**
 * Get message attachments
 */
export function useMessageAttachments(messageId: string | null) {
  return useQuery({
    queryKey: ['/api/messages', messageId, 'attachments'],
    enabled: !!messageId,
  });
}

/**
 * Get message reactions
 */
export function useMessageReactions(messageId: string | null) {
  return useQuery({
    queryKey: ['/api/messages', messageId, 'reactions'],
    enabled: !!messageId,
  });
}

// ===== MUTATION HOOKS =====

/**
 * Send a new message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { recipientId: string; body: string }) => {
      return await apiRequest('POST', '/api/messages', data);
    },
    onSuccess: (_, variables) => {
      // Invalidate conversations list to show new message
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      // Invalidate the specific conversation if we can determine it
      // This will be refined by WebSocket updates
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'],
        refetchType: 'active',
      });
    },
  });
}

/**
 * Upload attachment to a message
 */
export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, file }: { messageId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/messages/${messageId}/attachments`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload attachment');
      }

      return await response.json();
    },
    onSuccess: (_, { messageId }) => {
      // Refetch the message to show the new attachment
      queryClient.invalidateQueries({ 
        queryKey: ['/api/messages', messageId, 'attachments'],
      });
      
      // Also invalidate the conversation to update UI
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'],
        refetchType: 'active',
      });
    },
  });
}

/**
 * Add a reaction to a message
 */
export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      return await apiRequest('POST', `/api/messages/${messageId}/reactions`, { emoji });
    },
    onSuccess: (_, { messageId }) => {
      // Refetch reactions for this message
      queryClient.invalidateQueries({ 
        queryKey: ['/api/messages', messageId, 'reactions'],
      });
      
      // Also invalidate the conversation
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'],
        refetchType: 'active',
      });
    },
  });
}

/**
 * Remove a reaction from a message
 */
export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      return await apiRequest('DELETE', `/api/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
    },
    onSuccess: (_, { messageId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/messages', messageId, 'reactions'],
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'],
        refetchType: 'active',
      });
    },
  });
}

/**
 * Mark a message as read
 */
export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest('POST', `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      // Update conversations to reflect read status
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      // Update the active conversation
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'],
        refetchType: 'active',
      });
    },
  });
}

/**
 * Mark a message as delivered
 */
export function useMarkDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest('POST', `/api/messages/${messageId}/delivered`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'],
        refetchType: 'active',
      });
    },
  });
}

/**
 * Create a group conversation
 */
export function useCreateGroupConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      participantIds: string[];
      groupName: string;
      groupDescription?: string;
    }) => {
      return await apiRequest('POST', '/api/conversations/group', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}

/**
 * Add participant to group conversation
 */
export function useAddParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      return await apiRequest('POST', `/api/conversations/${conversationId}/participants`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}

/**
 * Remove participant from group conversation
 */
export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      return await apiRequest('DELETE', `/api/conversations/${conversationId}/participants/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}
