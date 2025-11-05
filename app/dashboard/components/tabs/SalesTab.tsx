"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Percent,
  Coins,
  FileText,
  Download,
  Calendar,
  Users
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface FileSale {
  id: string;
  filename: string;
  buyerId: string;
  buyerUsername: string;
  price: number;
  commission: number;
  netEarnings: number;
  createdAt: string;
  downloadCount?: number;
}

interface SalesDashboardData {
  totalSales: number;
  totalGrossRevenue: number;
  totalCommission: number;
  totalNetEarnings: number;
  avgSalePrice: number;
  uniqueBuyers: number;
  topSellingFile?: {
    filename: string;
    salesCount: number;
    revenue: number;
  };
  recentSales: FileSale[];
  salesByFile: Array<{
    filename: string;
    salesCount: number;
    totalRevenue: number;
    downloadCount: number;
  }>;
}

export function SalesTab() {
  const [filters, setFilters] = useState({});

  // Fetch sales dashboard data
  const { data: dashboardData, isLoading } = useQuery<SalesDashboardData>({
    queryKey: ["/api/user/file-sales", filters],
    queryFn: async () => {
      const response = await fetch("/api/user/file-sales", {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch sales data');
      return response.json();
    },
  });

  // Calculate commission percentage for display
  const commissionRate = 8.5; // Platform takes 8.5%

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Sales"
          value={dashboardData?.totalSales || 0}
          icon={ShoppingCart}
          trend={12.5}
          trendLabel="vs last month"
          loading={isLoading}
          color="text-blue-500"
          data-testid="kpi-total-sales"
        />
        <KPICard
          title="Gross Revenue"
          value={`${dashboardData?.totalGrossRevenue || 0} coins`}
          icon={Coins}
          trend={18.3}
          loading={isLoading}
          color="text-yellow-500"
          data-testid="kpi-gross-revenue"
        />
        <KPICard
          title="Platform Fee (8.5%)"
          value={`${dashboardData?.totalCommission || 0} coins`}
          icon={Percent}
          trend={0}
          loading={isLoading}
          color="text-red-500"
          data-testid="kpi-commission"
        />
        <KPICard
          title="Net Earnings"
          value={`${dashboardData?.totalNetEarnings || 0} coins`}
          icon={DollarSign}
          trend={15.8}
          loading={isLoading}
          color="text-green-500"
          data-testid="kpi-net-earnings"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Avg Sale Price"
          value={`${dashboardData?.avgSalePrice?.toFixed(0) || 0} coins`}
          icon={TrendingUp}
          loading={isLoading}
          color="text-purple-500"
          data-testid="kpi-avg-sale-price"
        />
        <KPICard
          title="Unique Buyers"
          value={dashboardData?.uniqueBuyers || 0}
          icon={Users}
          loading={isLoading}
          color="text-indigo-500"
          data-testid="kpi-unique-buyers"
        />
        {dashboardData?.topSellingFile && (
          <KPICard
            title="Top Selling File"
            value={dashboardData.topSellingFile.filename}
            icon={FileText}
            loading={isLoading}
            color="text-orange-500"
            description={`${dashboardData.topSellingFile.salesCount} sales • ${dashboardData.topSellingFile.revenue} coins`}
            data-testid="kpi-top-file"
          />
        )}
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
            id: "sortBy",
            label: "Sort By",
            type: "select",
            options: [
              { value: "date_desc", label: "Newest First" },
              { value: "date_asc", label: "Oldest First" },
              { value: "price_high", label: "Price: High to Low" },
              { value: "price_low", label: "Price: Low to High" },
            ]
          }
        ]}
        data-testid="filter-panel-sales"
      />

      {/* Sales by File Summary */}
      {dashboardData?.salesByFile && dashboardData.salesByFile.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales by File</CardTitle>
            <CardDescription>
              Performance metrics for each of your files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="table-header-file">File</TableHead>
                    <TableHead className="text-right" data-testid="table-header-sales-count">Sales</TableHead>
                    <TableHead className="text-right" data-testid="table-header-downloads">Downloads</TableHead>
                    <TableHead className="text-right" data-testid="table-header-revenue">Total Revenue</TableHead>
                    <TableHead className="text-right" data-testid="table-header-net">Net Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.salesByFile.map((file, index) => {
                    const netEarnings = Math.floor(file.totalRevenue * (1 - commissionRate / 100));
                    return (
                      <TableRow key={index} data-testid={`row-file-${index}`}>
                        <TableCell className="font-medium" data-testid={`text-filename-${index}`}>
                          {file.filename}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-sales-count-${index}`}>
                          {file.salesCount}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-downloads-${index}`}>
                          <div className="flex items-center justify-end gap-1">
                            <Download className="h-3 w-3" />
                            {file.downloadCount}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-revenue-${index}`}>
                          <Badge variant="outline">{file.totalRevenue} coins</Badge>
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-net-${index}`}>
                          <span className="text-green-600 font-semibold">{netEarnings} coins</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>
            Your latest file sales with detailed breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : dashboardData?.recentSales && dashboardData.recentSales.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="table-header-date">Date</TableHead>
                    <TableHead data-testid="table-header-file">File</TableHead>
                    <TableHead data-testid="table-header-buyer">Buyer</TableHead>
                    <TableHead className="text-right" data-testid="table-header-price">Price</TableHead>
                    <TableHead className="text-right" data-testid="table-header-commission">Commission</TableHead>
                    <TableHead className="text-right" data-testid="table-header-net-earnings">Net Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.recentSales.map((sale) => (
                    <TableRow key={sale.id} data-testid={`row-sale-${sale.id}`}>
                      <TableCell data-testid={`text-date-${sale.id}`}>
                        <div>
                          <div className="font-medium">
                            {format(new Date(sale.createdAt), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(sale.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-filename-${sale.id}`}>
                        {sale.filename}
                      </TableCell>
                      <TableCell data-testid={`text-buyer-${sale.id}`}>
                        {sale.buyerUsername}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`text-price-${sale.id}`}>
                        <Badge variant="outline">{sale.price} coins</Badge>
                      </TableCell>
                      <TableCell className="text-right text-red-600" data-testid={`text-commission-${sale.id}`}>
                        -{sale.commission} coins
                      </TableCell>
                      <TableCell className="text-right" data-testid={`text-net-${sale.id}`}>
                        <span className="text-green-600 font-semibold">{sale.netEarnings} coins</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No sales yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by publishing files to the marketplace
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Summary</CardTitle>
          <CardDescription>
            Platform fee breakdown (8.5% per sale)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Total Gross Revenue</span>
              <span className="font-semibold" data-testid="text-summary-gross">
                {dashboardData?.totalGrossRevenue || 0} coins
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Platform Commission (8.5%)</span>
              <span className="font-semibold text-red-600" data-testid="text-summary-commission">
                -{dashboardData?.totalCommission || 0} coins
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-semibold">Your Net Earnings</span>
              <span className="font-bold text-green-600 text-lg" data-testid="text-summary-net">
                {dashboardData?.totalNetEarnings || 0} coins
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}