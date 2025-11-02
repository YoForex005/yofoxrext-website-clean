import { useQuery } from '@tanstack/react-query';

export function useModerationQueue(type: 'all' | 'threads' | 'replies' = 'all') {
  return useQuery({
    queryKey: ['/api/admin/moderation/queue', type],
    refetchInterval: 15000,
  });
}
