"use client";

import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface MarketplaceItemsFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  price?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  seller: string;
  category: string;
  status: string;
  price: number;
  sales: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceItemsResponse {
  items: MarketplaceItem[];
  total: number;
  page: number;
  totalPages: number;
}

export function useMarketplaceItems(filters: MarketplaceItemsFilters = {}) {
  const { toast } = useToast();

  const queryParams = new URLSearchParams();
  if (filters.page) queryParams.set("page", filters.page.toString());
  if (filters.limit) queryParams.set("limit", filters.limit.toString());
  if (filters.search) queryParams.set("search", filters.search);
  if (filters.category && filters.category !== "all") queryParams.set("category", filters.category);
  if (filters.status && filters.status !== "all") queryParams.set("status", filters.status);
  if (filters.price && filters.price !== "all") queryParams.set("price", filters.price);
  if (filters.sortBy) queryParams.set("sortBy", filters.sortBy);
  if (filters.sortOrder) queryParams.set("sortOrder", filters.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/marketplace/items${queryString ? `?${queryString}` : ""}`;

  return useQuery<MarketplaceItemsResponse>({
    queryKey: ["/api/admin/marketplace/items", filters],
    refetchInterval: 60000,
    staleTime: 60000,
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading marketplace items",
          description: error.message || "Failed to fetch marketplace items",
          variant: "destructive",
        });
      },
    },
  });
}
