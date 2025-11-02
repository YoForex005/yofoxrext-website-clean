"use client";

import { useContentTrends } from "@/hooks/useContentTrends";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { AlertCircle, RefreshCw } from "lucide-react";

export function ContentTrendChart() {
  const { data, isLoading, isError, refetch, isRefetching } = useContentTrends();

  if (isLoading) {
    return (
      <Card className="w-full" data-testid="content-trend-chart-loading">
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
      <Card className="w-full border-destructive" data-testid="content-trend-chart-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Chart
          </CardTitle>
          <CardDescription>Failed to load content trends data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            data-testid="button-retry-content-trends"
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
      <Card className="w-full" data-testid="content-trend-chart-empty">
        <CardHeader>
          <CardTitle>Content Trends (Last 30 Days)</CardTitle>
          <CardDescription>Content creation by type</CardDescription>
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

  const totalContent = data.data.reduce((sum, item) => 
    sum + item.ea + item.indicator + item.article + item.source_code, 0
  );

  return (
    <Card className="w-full" data-testid="content-trend-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Trends (Last 30 Days)</CardTitle>
            <CardDescription>
              Total: {totalContent.toLocaleString()} items created
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            data-testid="button-refresh-content-trends"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-popover-border rounded-lg shadow-lg p-3">
                      <p className="text-sm font-medium text-popover-foreground mb-2">
                        {formatDate(label)}
                      </p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-sm">
                          <span className="capitalize" style={{ color: entry.color }}>
                            {entry.name === 'source_code' ? 'Source Code' : entry.name}:
                          </span>
                          <span className="font-semibold" style={{ color: entry.color }}>
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
              formatter={(value) => {
                const labels: Record<string, string> = {
                  ea: 'EA',
                  indicator: 'Indicator',
                  article: 'Article',
                  source_code: 'Source Code'
                };
                return labels[value] || value;
              }}
            />
            <Bar dataKey="ea" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="indicator" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="article" stackId="a" fill="hsl(var(--chart-3))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="source_code" stackId="a" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
