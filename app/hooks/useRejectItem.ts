"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RejectItemParams {
  itemId: string;
  reason: string;
}

export function useRejectItem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, reason }: RejectItemParams) => {
      return apiRequest("POST", `/api/admin/marketplace/reject/${itemId}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/top-sellers"] });
      
      toast({
        title: "Item rejected",
        description: "The marketplace item has been rejected",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error rejecting item",
        description: error.message || "Failed to reject the item",
        variant: "destructive",
      });
    },
  });
}
