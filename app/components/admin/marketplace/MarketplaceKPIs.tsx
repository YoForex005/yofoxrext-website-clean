"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShoppingBag, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { MarketplaceStats } from "@/hooks/useMarketplaceStats";

interface MarketplaceKPIsProps {
  stats?: MarketplaceStats;
  isLoading?: boolean;
  error?: Error;
  onRetry?: () => void;
}

export function MarketplaceKPIs({ stats, isLoading, error, onRetry }: MarketplaceKPIsProps) {
  if (error) {
    return (
      <Alert variant="destructive" data-testid="kpis-error">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading statistics</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          {error.message || "Failed to fetch marketplace statistics"}
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} data-testid="button-retry-kpis">
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="kpis-loading">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card dark:bg-gray-800">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="kpis-container">
      <Card className="bg-card dark:bg-gray-800" data-testid="card-total-items">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <p className="text-sm text-gray-400">Total Items</p>
          <ShoppingBag className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground" data-testid="value-total-items">
            {stats?.totalItems.toLocaleString() || 0}
          </p>
          <p className="text-xs text-green-400 mt-1" data-testid="text-pending-approval">
            {stats?.pendingApproval || 0} pending approval
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card dark:bg-gray-800" data-testid="card-total-sales">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <p className="text-sm text-gray-400">Total Sales</p>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground" data-testid="value-total-sales">
            {stats?.totalSales.toLocaleString() || 0}
          </p>
          <p className="text-xs text-green-400 mt-1" data-testid="text-weekly-sales">
            +{stats?.weeklySales.toLocaleString() || 0} this week
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card dark:bg-gray-800" data-testid="card-total-revenue">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <p className="text-sm text-gray-400">Total Revenue</p>
          <DollarSign className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground" data-testid="value-total-revenue">
            ${stats?.totalRevenue.toLocaleString() || 0}
          </p>
          <p className="text-xs text-green-400 mt-1" data-testid="text-weekly-revenue">
            +${stats?.weeklyRevenue.toLocaleString() || 0} this week
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
