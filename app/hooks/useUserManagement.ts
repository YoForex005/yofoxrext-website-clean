"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface UserManagementFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  authMethod?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface UserStats {
  totalUsers: number;
  avgReputation: number;
  avgCoins: number;
  bannedCount: number;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  authMethod: string;
  status: string;
  reputation: number;
  coins: number;
  lastLogin: string | null;
  createdAt: string;
  bannedAt: string | null;
  banReason: string | null;
  avatar?: string;
}

export interface UserManagementResponse {
  users: UserData[];
  total: number;
  page: number;
  totalPages: number;
  stats: UserStats;
}

export function useUserManagement(filters: UserManagementFilters = {}) {
  const { toast } = useToast();

  const queryParams = new URLSearchParams();
  if (filters.page) queryParams.set("page", filters.page.toString());
  if (filters.limit) queryParams.set("limit", filters.limit.toString());
  if (filters.search) queryParams.set("search", filters.search);
  if (filters.role && filters.role !== "all") queryParams.set("role", filters.role);
  if (filters.status && filters.status !== "all") queryParams.set("status", filters.status);
  if (filters.authMethod && filters.authMethod !== "all") queryParams.set("authMethod", filters.authMethod);
  if (filters.sortBy) queryParams.set("sortBy", filters.sortBy);
  if (filters.sortOrder) queryParams.set("sortOrder", filters.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/users${queryString ? `?${queryString}` : ""}`;

  return useQuery<UserManagementResponse>({
    queryKey: ["/api/admin/users", filters],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading users",
          description: error.message || "Failed to fetch user data",
          variant: "destructive",
        });
      },
    },
  });
}
