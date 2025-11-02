"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface TopSellerItem {
  id: string;
  title: string;
  seller: string;
  sales: number;
  revenue: number;
}

export function useTopSellers() {
  const { toast } = useToast();

  return useQuery<TopSellerItem[]>({
    queryKey: ["/api/admin/marketplace/top-sellers"],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading top sellers",
          description: error.message || "Failed to fetch top selling items",
          variant: "destructive",
        });
      },
    },
  });
}
