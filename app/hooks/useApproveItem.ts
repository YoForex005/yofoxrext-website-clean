"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useApproveItem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("POST", `/api/admin/marketplace/approve/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/top-sellers"] });
      
      toast({
        title: "Item approved",
        description: "The marketplace item has been approved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error approving item",
        description: error.message || "Failed to approve the item",
        variant: "destructive",
      });
    },
  });
}
