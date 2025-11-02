"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { RevenueTrendData } from "@/hooks/useRevenueTrend";

interface RevenueTrendChartProps {
  data?: RevenueTrendData[];
  isLoading?: boolean;
  error?: Error;
}

export function RevenueTrendChart({ data, isLoading, error }: RevenueTrendChartProps) {
  if (error) {
    return (
      <Card className="bg-card dark:bg-gray-800" data-testid="chart-error">
        <CardHeader>
          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading chart</AlertTitle>
            <AlertDescription>
              {error.message || "Failed to fetch revenue trend data"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="bg-card dark:bg-gray-800" data-testid="chart-loading">
        <CardHeader>
          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card dark:bg-gray-800" data-testid="revenue-trend-chart">
      <CardHeader>
        <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No revenue data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#9CA3AF" }}
                tickFormatter={(date) => format(new Date(date), "MMM dd")}
              />
              <YAxis
                tick={{ fill: "#9CA3AF" }}
                domain={[0, "auto"]}
                label={{
                  value: "Revenue ($)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#9CA3AF" },
                }}
              />
              <Tooltip
                contentStyle={{
                  background: "#1F2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
