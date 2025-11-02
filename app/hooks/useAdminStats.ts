"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface AdminStats {
  totalUsers: number;
  activeUsersToday: number;
  totalContent: number;
  totalRevenue: number;
  totalTransactions: number;
  forumThreads: number;
  forumReplies: number;
  brokerReviews: number;
  userGrowthPercent?: number;
}

export function useAdminStats() {
  const { toast } = useToast();

  return useQuery<AdminStats>({
    queryKey: ["/api/admin/analytics/stats"],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading stats",
          description: error.message || "Failed to fetch admin statistics",
          variant: "destructive",
        });
      },
    },
  });
}
