import { useQuery } from '@tanstack/react-query';

interface FeatureFlagResponse {
  slug: string;
  status: 'enabled' | 'disabled' | 'coming_soon';
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
}

interface UseFeatureFlagResult {
  status: 'enabled' | 'disabled' | 'coming_soon' | null;
  isLoading: boolean;
  error: Error | null;
  flag: FeatureFlagResponse | null;
}

/**
 * Hook to check feature flag status
 * @param slug - The feature flag slug to check
 * @returns { status, isLoading, error, flag }
 */
export function useFeatureFlag(slug: string): UseFeatureFlagResult {
  const { data, isLoading, error } = useQuery<FeatureFlagResponse>({
    queryKey: ['/api/feature-flags', slug],
    queryFn: async () => {
      const response = await fetch(`/api/feature-flags?slug=${encodeURIComponent(slug)}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch feature flag');
      }
      return response.json();
    },
    staleTime: 60000, // Cache for 60 seconds (matches server cache TTL)
    retry: false,
  });

  return {
    status: data?.status ?? null,
    isLoading,
    error: error as Error | null,
    flag: data ?? null,
  };
}
