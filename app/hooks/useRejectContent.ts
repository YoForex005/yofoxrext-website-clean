import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useRejectContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, contentType, reason }: { id: string; contentType: 'thread' | 'reply'; reason: string }) => {
      return apiRequest('POST', `/api/admin/moderation/reject/${id}`, { contentType, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/queue'] });
    },
  });
}
