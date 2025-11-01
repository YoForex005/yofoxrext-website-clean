'use client';

import { useQuery } from '@tanstack/react-query';
import { useDebounce } from './use-debounce';
import type { MessageSearchResult } from '@/types/messaging';

/**
 * Custom React Query hook for searching messages with debouncing
 * @param query - Search query string
 * @returns Query result with messages, loading state, and error
 */
export function useSearchMessages(query: string) {
  // Debounce the search query by 500ms to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 500);

  return useQuery<MessageSearchResult[]>({
    queryKey: ['/api/messages/search', { q: debouncedQuery }],
    // Only search when query length >= 3 characters
    enabled: debouncedQuery.length >= 3,
    // Cache results for 5 minutes (300000ms)
    staleTime: 300000,
  });
}
