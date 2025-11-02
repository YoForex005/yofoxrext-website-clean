"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, Activity, TrendingUp, TrendingDown, AlertCircle, Award } from "lucide-react";
import { FinanceStats } from "@/hooks/useFinanceStats";

interface KPICardsGridProps {
  stats?: FinanceStats;
  isLoading?: boolean;
  error?: Error;
  onRetry?: () => void;
}

export function KPICardsGrid({ stats, isLoading, error, onRetry }: KPICardsGridProps) {
  if (error) {
    return (
      <Alert variant="destructive" data-testid="kpis-error">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading statistics</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          {error.message || "Failed to fetch finance statistics"}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpis-loading">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <Skeleton className="h-4 w-24 bg-gray-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2 bg-gray-700" />
              <Skeleton className="h-3 w-28 bg-gray-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const percentChange = stats?.totalRevenue.percentChange || 0;
  const isPositive = percentChange >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpis-container">
      <Card className="bg-gray-800 border-gray-700" data-testid="card-total-revenue">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <p className="text-sm text-gray-400">Total Revenue</p>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-white" data-testid="value-total-revenue">
            ${stats?.totalRevenue.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </p>
          <p className={`text-xs mt-1 flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`} data-testid="text-revenue-change">
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{percentChange.toFixed(1)}% from last period
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700" data-testid="card-pending-withdrawals">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <p className="text-sm text-gray-400">Pending Withdrawals</p>
          <CreditCard className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-white" data-testid="value-pending-count">
            {stats?.pendingWithdrawals.count || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1" data-testid="text-pending-total">
            ${stats?.pendingWithdrawals.total.toLocaleString() || 0} total
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700" data-testid="card-total-transactions">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <p className="text-sm text-gray-400">Total Transactions</p>
          <Activity className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-white" data-testid="value-total-transactions">
            {stats?.transactions.total.toLocaleString() || 0}
          </p>
          <p className="text-xs text-green-400 mt-1" data-testid="text-today-transactions">
            +{stats?.transactions.today || 0} today
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700" data-testid="card-top-earner">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <p className="text-sm text-gray-400">Top Earner</p>
          <Award className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          {stats?.topEarner ? (
            <>
              <p className="text-xl font-bold text-white truncate" data-testid="value-top-earner-name">
                {stats.topEarner.username}
              </p>
              <p className="text-xs text-gray-400 mt-1" data-testid="text-top-earner-amount">
                ${stats.topEarner.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </>
          ) : (
            <p className="text-lg text-gray-500" data-testid="text-no-earner">No data</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
