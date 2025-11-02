import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useApproveContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, contentType }: { id: string; contentType: 'thread' | 'reply' }) => {
      return apiRequest('POST', `/api/admin/moderation/approve/${id}`, { contentType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/queue'] });
    },
  });
}
