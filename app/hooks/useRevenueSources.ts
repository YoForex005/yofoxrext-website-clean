"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface RevenueSourceData {
  source: string;
  amount: number;
  count: number;
}

export function useRevenueSources(days: number = 30) {
  const { toast } = useToast();

  return useQuery<RevenueSourceData[]>({
    queryKey: ["/api/admin/finance/revenue-sources", days],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading revenue sources",
          description: error.message || "Failed to fetch revenue sources data",
          variant: "destructive",
        });
      },
    },
  });
}
