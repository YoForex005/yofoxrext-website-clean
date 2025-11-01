import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { UserMessageSettings, BlockedUser, User } from '@shared/schema';

export function usePrivacySettings() {
  return useQuery<UserMessageSettings>({
    queryKey: ['/api/messages/settings'],
  });
}

export function useUpdatePrivacySettings() {
  return useMutation({
    mutationFn: async (settings: Partial<UserMessageSettings>) => {
      return await apiRequest('/api/messages/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/settings'] });
    },
  });
}

export function useBlockedUsers() {
  return useQuery<Array<BlockedUser & { blockedUser: User }>>({
    queryKey: ['/api/messages/blocked-users'],
  });
}

export function useBlockUser() {
  return useMutation({
    mutationFn: async ({ blockedId, reason }: { blockedId: string; reason?: string }) => {
      return await apiRequest('/api/messages/block-user', {
        method: 'POST',
        body: JSON.stringify({ blockedId, reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/blocked-users'] });
    },
  });
}

export function useUnblockUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/messages/unblock/${userId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/blocked-users'] });
    },
  });
}

export function useExportMessages() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/messages/export', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to export messages');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `messages-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}
