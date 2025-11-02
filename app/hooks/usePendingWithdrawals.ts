"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  method: string;
  walletAddress: string | null;
  status: string;
  requestedAt: Date;
}

export interface PendingWithdrawalsResponse {
  withdrawals: WithdrawalRequest[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function usePendingWithdrawals(page: number = 1, limit: number = 20) {
  const { toast } = useToast();

  return useQuery<PendingWithdrawalsResponse>({
    queryKey: ["/api/admin/finance/withdrawals/pending", page, limit],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading pending withdrawals",
          description: error.message || "Failed to fetch pending withdrawals",
          variant: "destructive",
        });
      },
    },
  });
}
