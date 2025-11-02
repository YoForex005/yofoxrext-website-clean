"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useApproveWithdrawal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return apiRequest("POST", `/api/admin/finance/withdrawals/approve/${id}`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance/withdrawals/pending"] });
      
      toast({
        title: "Withdrawal approved",
        description: "The withdrawal request has been approved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error approving withdrawal",
        description: error.message || "Failed to approve the withdrawal",
        variant: "destructive",
      });
    },
  });
}
