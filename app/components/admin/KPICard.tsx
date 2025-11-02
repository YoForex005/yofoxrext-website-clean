"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  loading?: boolean;
  error?: boolean;
  trend?: number;
  trendLabel?: string;
  color?: string;
  "data-testid"?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  loading = false,
  error = false,
  trend,
  trendLabel,
  color = "text-muted-foreground",
  "data-testid": testId,
}: KPICardProps) {
  if (loading) {
    return (
      <Card className="bg-card dark:bg-gray-800" data-testid={testId}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card dark:bg-gray-800 border-destructive" data-testid={testId}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">Error loading data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card dark:bg-gray-800" data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground" data-testid={`${testId}-value`}>
          {value}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs mt-1">
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={trend >= 0 ? "text-green-500" : "text-red-500"}>
              {trend >= 0 ? "+" : ""}{trend}%
            </span>
            {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
