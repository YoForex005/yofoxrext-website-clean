"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface RevenueTrendData {
  date: string;
  revenue: number;
  sales: number;
}

export function useRevenueTrend(days: number = 30) {
  const { toast } = useToast();

  return useQuery<RevenueTrendData[]>({
    queryKey: ["/api/admin/marketplace/revenue-trend", days],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading revenue trend",
          description: error.message || "Failed to fetch revenue trend data",
          variant: "destructive",
        });
      },
    },
  });
}
