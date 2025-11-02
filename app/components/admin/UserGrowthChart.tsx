"use client";

import { useUserGrowth } from "@/hooks/useUserGrowth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format } from "date-fns";
import { AlertCircle, RefreshCw } from "lucide-react";

export function UserGrowthChart() {
  const { data, isLoading, isError, refetch, isRefetching } = useUserGrowth();

  if (isLoading) {
    return (
      <Card className="w-full" data-testid="user-growth-chart-loading">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full border-destructive" data-testid="user-growth-chart-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Chart
          </CardTitle>
          <CardDescription>Failed to load user growth data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            data-testid="button-retry-user-growth"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Card className="w-full" data-testid="user-growth-chart-empty">
        <CardHeader>
          <CardTitle>User Growth (Last 30 Days)</CardTitle>
          <CardDescription>Daily new user registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM dd");
    } catch {
      return dateStr;
    }
  };

  const totalUsers = data.data.reduce((sum, item) => sum + item.users, 0);
  const avgUsers = Math.round(totalUsers / data.data.length);

  return (
    <Card className="w-full" data-testid="user-growth-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Growth (Last 30 Days)</CardTitle>
            <CardDescription>
              Total: {totalUsers.toLocaleString()} users | Avg: {avgUsers.toLocaleString()}/day
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            data-testid="button-refresh-user-growth"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-popover-border rounded-lg shadow-lg p-3">
                      <p className="text-sm font-medium text-popover-foreground">
                        {formatDate(payload[0].payload.date)}
                      </p>
                      <p className="text-sm text-primary font-semibold">
                        {payload[0].value} users
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorUsers)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
