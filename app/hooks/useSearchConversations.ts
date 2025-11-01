'use client';

import { useQuery } from '@tanstack/react-query';
import { useDebounce } from './use-debounce';
import type { ConversationWithDetails } from '@/types/messaging';

/**
 * Custom React Query hook for searching conversations with debouncing
 * @param query - Search query string
 * @returns Query result with conversations, loading state, and error
 */
export function useSearchConversations(query: string) {
  // Debounce the search query by 500ms to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 500);

  return useQuery<ConversationWithDetails[]>({
    queryKey: ['/api/conversations/search', { q: debouncedQuery }],
    // Only search when query length >= 2 characters
    enabled: debouncedQuery.length >= 2,
    // Cache results for 5 minutes (300000ms)
    staleTime: 300000,
  });
}
