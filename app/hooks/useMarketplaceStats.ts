"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface MarketplaceStats {
  totalItems: number;
  pendingApproval: number;
  totalSales: number;
  weeklySales: number;
  totalRevenue: number;
  weeklyRevenue: number;
  updatedAt: string;
}

export function useMarketplaceStats() {
  const { toast } = useToast();

  return useQuery<MarketplaceStats>({
    queryKey: ["/api/admin/marketplace/stats"],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading marketplace statistics",
          description: error.message || "Failed to fetch marketplace stats",
          variant: "destructive",
        });
      },
    },
  });
}
