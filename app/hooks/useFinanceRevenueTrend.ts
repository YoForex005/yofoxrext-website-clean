"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface FinanceRevenueTrendData {
  date: string;
  totalRevenue: number;
  platformFee: number;
  netPayout: number;
  count: number;
}

export function useFinanceRevenueTrend(days: number = 30) {
  const { toast } = useToast();

  return useQuery<FinanceRevenueTrendData[]>({
    queryKey: ["/api/admin/finance/revenue-trend", days],
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
