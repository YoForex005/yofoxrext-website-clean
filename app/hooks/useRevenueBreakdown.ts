"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface RevenueBySource {
  source: string;
  amount: number;
}

export interface TopEarner {
  userId: string;
  username: string;
  totalEarnings: number;
}

export interface RecentTransaction {
  id: number;
  amount: number;
  type: string;
  createdAt: string;
  username: string;
}

export interface RevenueBreakdownResponse {
  bySource: RevenueBySource[];
  topEarners: TopEarner[];
  recentTransactions: RecentTransaction[];
  updatedAt: string;
}

export function useRevenueBreakdown() {
  const { toast } = useToast();

  return useQuery<RevenueBreakdownResponse>({
    queryKey: ["/api/admin/analytics/revenue"],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading revenue data",
          description: error.message || "Failed to fetch revenue analytics",
          variant: "destructive",
        });
      },
    },
  });
}
