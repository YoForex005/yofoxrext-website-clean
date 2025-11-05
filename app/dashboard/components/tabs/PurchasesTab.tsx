"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterPanel } from "../shared/FilterPanel";
import { KPICard } from "../shared/KPICard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  FileText,
  FileArchive,
  FileCode,
  File,
  Coins,
  Package,
  TrendingUp,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import type { FilePurchase, FileAsset } from "@shared/schema";

interface PurchaseWithAsset extends FilePurchase {
  asset: FileAsset & {
    filename: string;
    fileType: string;
    fileSize: number;
  };
  sellerUsername?: string;
}

interface PurchasesDashboardData {
  totalPurchases: number;
  totalSpent: number;
  avgPurchasePrice: number;
  uniqueSellers: number;
  recentPurchases: PurchaseWithAsset[];
}

// File type to icon mapping
const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  
  if (['ex4', 'ex5', 'mq4', 'mq5'].includes(type)) {
    return <FileCode className="h-4 w-4 text-purple-500" />;
  } else if (['pdf'].includes(type)) {
    return <FileText className="h-4 w-4 text-red-500" />;
  } else if (['zip', 'rar', '7z'].includes(type)) {
    return <FileArchive className="h-4 w-4 text-blue-500" />;
  } else {
    return <File className="h-4 w-4 text-gray-500" />;
  }
};

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export function PurchasesTab() {
  const [filters, setFilters] = useState({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch purchases dashboard data
  const { data: dashboardData, isLoading } = useQuery<PurchasesDashboardData>({
    queryKey: ["/api/user/purchases-dashboard", filters],
    queryFn: async () => {
      const response = await fetch("/api/user/purchases-dashboard", {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch purchases data');
      return response.json();
    },
  });

  // Fetch detailed purchases list
  const { data: purchases, isLoading: purchasesLoading } = useQuery<PurchaseWithAsset[]>({
    queryKey: ["/api/user/file-purchases", filters],
    queryFn: async () => {
      const response = await fetch("/api/user/file-purchases", {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch purchases');
      return response.json();
    },
  });

  // Handle file download
  const handleDownload = async (purchaseId: string, filename: string) => {
    setDownloadingId(purchaseId);
    
    try {
      const response = await fetch(`/api/downloads/${purchaseId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      const data = await response.json();
      
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Purchases"
          value={dashboardData?.totalPurchases || 0}
          icon={Package}
          trend={12.5}
          trendLabel="vs last month"
          loading={isLoading}
          color="text-blue-500"
          data-testid="kpi-total-purchases"
        />
        <KPICard
          title="Total Spent"
          value={`${dashboardData?.totalSpent || 0} coins`}
          icon={Coins}
          trend={-5.2}
          loading={isLoading}
          color="text-yellow-500"
          data-testid="kpi-total-spent"
        />
        <KPICard
          title="Avg Purchase Price"
          value={`${dashboardData?.avgPurchasePrice?.toFixed(0) || 0} coins`}
          icon={TrendingUp}
          trend={3.8}
          loading={isLoading}
          color="text-green-500"
          data-testid="kpi-avg-purchase-price"
        />
        <KPICard
          title="Unique Sellers"
          value={dashboardData?.uniqueSellers || 0}
          icon={Package}
          loading={isLoading}
          color="text-purple-500"
          data-testid="kpi-unique-sellers"
        />
      </div>

      {/* Filters */}
      <FilterPanel
        onFiltersChange={setFilters}
        filterOptions={[
          { 
            id: "dateRange", 
            label: "Date Range", 
            type: "select",
            options: [
              { value: "all", label: "All Time" },
              { value: "today", label: "Today" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
              { value: "year", label: "This Year" },
            ]
          },
          {
            id: "fileType",
            label: "File Type",
            type: "select",
            options: [
              { value: "all", label: "All Types" },
              { value: "ex4", label: "EX4" },
              { value: "ex5", label: "EX5" },
              { value: "pdf", label: "PDF" },
              { value: "zip", label: "ZIP" },
            ]
          }
        ]}
        data-testid="filter-panel-purchases"
      />

      {/* Recent Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Purchases</CardTitle>
          <CardDescription>
            All files you've purchased from the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {purchasesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : purchases && purchases.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="table-header-file">File</TableHead>
                    <TableHead data-testid="table-header-seller">Seller</TableHead>
                    <TableHead data-testid="table-header-price">Price</TableHead>
                    <TableHead data-testid="table-header-date">Purchase Date</TableHead>
                    <TableHead data-testid="table-header-downloads">Downloads</TableHead>
                    <TableHead data-testid="table-header-action">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id} data-testid={`row-purchase-${purchase.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {getFileIcon(purchase.asset?.fileType || 'file')}
                          <div>
                            <div className="font-medium" data-testid={`text-filename-${purchase.id}`}>
                              {purchase.asset?.filename || 'Unknown File'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatFileSize(purchase.asset?.fileSize || 0)} • {purchase.asset?.fileType?.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-seller-${purchase.id}`}>
                        {purchase.sellerUsername || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Coins className="h-3 w-3 mr-1" />
                          {purchase.price}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-date-${purchase.id}`}>
                        {format(new Date(purchase.purchaseDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell data-testid={`text-downloads-${purchase.id}`}>
                        {purchase.downloadCount || 0}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(purchase.id, purchase.asset?.filename || 'download')}
                          disabled={downloadingId === purchase.id}
                          data-testid={`button-download-${purchase.id}`}
                        >
                          {downloadingId === purchase.id ? (
                            <>Downloading...</>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2" data-testid="text-no-purchases">
                No Purchases Yet
              </h3>
              <p className="text-muted-foreground mb-4">
                You haven't purchased any files from the marketplace.
              </p>
              <Button variant="default" asChild data-testid="button-browse-marketplace">
                <a href="/marketplace">
                  Browse Marketplace
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {dashboardData?.recentPurchases && dashboardData.recentPurchases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest file purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentPurchases.slice(0, 5).map((purchase) => (
                <div 
                  key={purchase.id} 
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                  data-testid={`activity-purchase-${purchase.id}`}
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(purchase.asset?.fileType || 'file')}
                    <div>
                      <p className="font-medium">
                        {purchase.asset?.filename || 'Unknown File'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        From {purchase.sellerUsername || 'Unknown Seller'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      <Coins className="h-3 w-3 mr-1" />
                      {purchase.price}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(purchase.purchaseDate), 'MMM d')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}