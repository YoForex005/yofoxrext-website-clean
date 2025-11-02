"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface FinanceStats {
  totalRevenue: {
    amount: number;
    platformFee: number;
    percentChange: number;
  };
  pendingWithdrawals: {
    count: number;
    total: number;
  };
  transactions: {
    total: number;
    today: number;
  };
  topEarner: {
    username: string;
    amount: number;
  } | null;
}

export function useFinanceStats(days: number = 30) {
  const { toast } = useToast();

  return useQuery<FinanceStats>({
    queryKey: ["/api/admin/finance/stats", days],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading finance statistics",
          description: error.message || "Failed to fetch finance stats",
          variant: "destructive",
        });
      },
    },
  });
}
