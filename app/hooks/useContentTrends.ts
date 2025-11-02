"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface ContentTrendData {
  date: string;
  ea: number;
  indicator: number;
  article: number;
  source_code: number;
}

export interface ContentTrendsResponse {
  data: ContentTrendData[];
  updatedAt: string;
}

export function useContentTrends() {
  const { toast } = useToast();

  return useQuery<ContentTrendsResponse>({
    queryKey: ["/api/admin/analytics/content-trends"],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading content trends",
          description: error.message || "Failed to fetch content trends analytics",
          variant: "destructive",
        });
      },
    },
  });
}
