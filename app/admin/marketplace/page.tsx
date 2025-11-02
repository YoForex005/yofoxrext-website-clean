"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminAuthCheck } from "@/admin/auth-check";
import { MarketplaceHeader } from "@/components/admin/marketplace/MarketplaceHeader";
import { MarketplaceKPIs } from "@/components/admin/marketplace/MarketplaceKPIs";
import { MarketplaceFilters } from "@/components/admin/marketplace/MarketplaceFilters";
import { RevenueTrendChart } from "@/components/admin/marketplace/RevenueTrendChart";
import { TopSellingItems } from "@/components/admin/marketplace/TopSellingItems";
import { TopVendors } from "@/components/admin/marketplace/TopVendors";
import { AddContentModal } from "@/components/admin/marketplace/AddContentModal";
import { MarketplaceItemsTable } from "@/components/admin/marketplace/MarketplaceItemsTable";
import { RejectItemModal } from "@/components/admin/marketplace/RejectItemModal";
import { useMarketplaceStats } from "@/hooks/useMarketplaceStats";
import { useRevenueTrend } from "@/hooks/useRevenueTrend";
import { useMarketplaceItems, type MarketplaceItem } from "@/hooks/useMarketplaceItems";
import { useTopSellers } from "@/hooks/useTopSellers";
import { useTopVendors } from "@/hooks/useTopVendors";
import { useApproveItem } from "@/hooks/useApproveItem";
import { useRejectItem } from "@/hooks/useRejectItem";
import { useToast } from "@/hooks/use-toast";

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    page: Number(searchParams.get("page")) || 1,
    limit: 20,
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "all",
    status: searchParams.get("status") || "all",
    price: searchParams.get("price") || "all",
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: searchParams.get("sortOrder") || "desc",
  });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.page && filters.page > 1) params.set("page", filters.page.toString());
    if (filters.search) params.set("search", filters.search);
    if (filters.category && filters.category !== "all") params.set("category", filters.category);
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    if (filters.price && filters.price !== "all") params.set("price", filters.price);
    if (filters.sortBy && filters.sortBy !== "createdAt") params.set("sortBy", filters.sortBy);
    if (filters.sortOrder && filters.sortOrder !== "desc") params.set("sortOrder", filters.sortOrder);

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl);
  }, [filters, router]);

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useMarketplaceStats();
  const { data: trendData, isLoading: trendLoading, error: trendError } = useRevenueTrend(30);
  const { data: itemsData, isLoading: itemsLoading, error: itemsError } = useMarketplaceItems(filters);
  const { data: topSellers, isLoading: sellersLoading } = useTopSellers();
  const { data: topVendors, isLoading: vendorsLoading } = useTopVendors();

  const { mutate: approveItem, isPending: isApproving } = useApproveItem();
  const { mutate: rejectItem, isPending: isRejecting } = useRejectItem();

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: "",
      category: "all",
      status: "all",
      price: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const handleApprove = (itemId: string) => {
    if (confirm('Are you sure you want to approve this item?')) {
      approveItem(itemId, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Item approved successfully",
          });
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to approve item",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleRejectClick = (item: MarketplaceItem) => {
    setSelectedItem(item);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = (reason: string) => {
    if (!selectedItem) return;
    
    rejectItem(
      { itemId: selectedItem.id, reason },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Item rejected successfully",
          });
          setRejectModalOpen(false);
          setSelectedItem(null);
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to reject item",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6" data-testid="marketplace-page">
      <MarketplaceHeader onAddClick={() => setAddModalOpen(true)} />

      <MarketplaceFilters
        filters={{
          search: filters.search,
          category: filters.category,
          status: filters.status,
          price: filters.price,
        }}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      <MarketplaceKPIs
        stats={stats}
        isLoading={statsLoading}
        error={statsError || undefined}
        onRetry={refetchStats}
      />

      <RevenueTrendChart data={trendData} isLoading={trendLoading} error={trendError || undefined} />

      <MarketplaceItemsTable 
        items={itemsData?.items || []}
        isLoading={itemsLoading}
        error={itemsError || null}
        page={itemsData?.page || 1}
        totalPages={itemsData?.totalPages || 1}
        onPageChange={(page) => handleFilterChange({ page })}
        onApprove={handleApprove}
        onReject={handleRejectClick}
        isApproving={isApproving}
        isRejecting={isRejecting}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="top-sections-grid">
        <TopSellingItems items={topSellers || []} isLoading={sellersLoading} />
        <TopVendors vendors={topVendors || []} isLoading={vendorsLoading} />
      </div>

      <AddContentModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      
      <RejectItemModal 
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        item={selectedItem}
        onConfirm={handleRejectConfirm}
        isRejecting={isRejecting}
      />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <AdminAuthCheck>
      <MarketplaceContent />
    </AdminAuthCheck>
  );
}
