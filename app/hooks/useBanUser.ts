"use client";

import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface BanUserParams {
  userId: string;
  reason: string;
  duration?: number;
}

interface BanUserResponse {
  success: boolean;
  message: string;
}

interface MutationContext {
  previousData: [any, any][];
}

export function useBanUser() {
  const { toast } = useToast();

  return useMutation<BanUserResponse, Error, BanUserParams, MutationContext>({
    mutationFn: async ({ userId, reason, duration }: BanUserParams) => {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason, duration }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to ban user");
      }

      return response.json();
    },
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/admin/users"] });

      const previousData = queryClient.getQueriesData({ queryKey: ["/api/admin/users"] });

      queryClient.setQueriesData(
        { queryKey: ["/api/admin/users"] },
        (old: any) => {
          if (!old?.users) return old;
          return {
            ...old,
            users: old.users.map((user: any) =>
              user.id === userId
                ? { ...user, status: "banned", bannedAt: new Date().toISOString() }
                : user
            ),
          };
        }
      );

      return { previousData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User banned successfully",
        description: data.message || "The user has been banned from the platform.",
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast({
        title: "Failed to ban user",
        description: error.message || "An error occurred while banning the user.",
        variant: "destructive",
      });
    },
  });
}

export function useUnbanUser() {
  const { toast } = useToast();

  return useMutation<BanUserResponse, Error, string, MutationContext>({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}/unban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to unban user");
      }

      return response.json();
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["/api/admin/users"] });

      const previousData = queryClient.getQueriesData({ queryKey: ["/api/admin/users"] });

      queryClient.setQueriesData(
        { queryKey: ["/api/admin/users"] },
        (old: any) => {
          if (!old?.users) return old;
          return {
            ...old,
            users: old.users.map((user: any) =>
              user.id === userId
                ? { ...user, status: "active", bannedAt: null, banReason: null }
                : user
            ),
          };
        }
      );

      return { previousData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User unbanned successfully",
        description: data.message || "The user has been unbanned and can access the platform again.",
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast({
        title: "Failed to unban user",
        description: error.message || "An error occurred while unbanning the user.",
        variant: "destructive",
      });
    },
  });
}
