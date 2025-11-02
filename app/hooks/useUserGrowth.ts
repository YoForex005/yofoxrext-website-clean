"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface UserGrowthData {
  date: string;
  users: number;
}

export interface UserGrowthResponse {
  data: UserGrowthData[];
  updatedAt: string;
}

export function useUserGrowth() {
  const { toast } = useToast();

  return useQuery<UserGrowthResponse>({
    queryKey: ["/api/admin/analytics/user-growth"],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading user growth data",
          description: error.message || "Failed to fetch user growth analytics",
          variant: "destructive",
        });
      },
    },
  });
}
