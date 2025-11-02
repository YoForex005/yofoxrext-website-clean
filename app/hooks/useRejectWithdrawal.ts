"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useRejectWithdrawal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiRequest("POST", `/api/admin/finance/withdrawals/reject/${id}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance/withdrawals/pending"] });
      
      toast({
        title: "Withdrawal rejected",
        description: "The withdrawal request has been rejected",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error rejecting withdrawal",
        description: error.message || "Failed to reject the withdrawal",
        variant: "destructive",
      });
    },
  });
}
