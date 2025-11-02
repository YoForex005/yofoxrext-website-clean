"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface TopVendor {
  userId: string;
  username: string;
  items: number;
  sales: number;
  revenue: number;
}

export function useTopVendors() {
  const { toast } = useToast();

  return useQuery<TopVendor[]>({
    queryKey: ["/api/admin/marketplace/top-vendors"],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading top vendors",
          description: error.message || "Failed to fetch top vendors",
          variant: "destructive",
        });
      },
    },
  });
}
