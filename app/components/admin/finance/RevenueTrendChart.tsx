"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FinanceRevenueTrendData } from "@/hooks/useFinanceRevenueTrend";
import { TrendingUp } from "lucide-react";

interface RevenueTrendChartProps {
  data?: FinanceRevenueTrendData[];
  isLoading?: boolean;
}

export function RevenueTrendChart({ data, isLoading }: RevenueTrendChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700" data-testid="revenue-trend-loading">
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-gray-700" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full bg-gray-700" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data && data.length > 0;

  return (
    <Card className="bg-gray-800 border-gray-700" data-testid="revenue-trend-chart">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Revenue Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#FFF',
                }}
              />
              <Legend wrapperStyle={{ color: '#9CA3AF' }} />
              <Line type="monotone" dataKey="totalRevenue" stroke="#10B981" strokeWidth={2} name="Total Revenue" />
              <Line type="monotone" dataKey="platformFee" stroke="#F59E0B" strokeWidth={2} name="Platform Fee" />
              <Line type="monotone" dataKey="netPayout" stroke="#3B82F6" strokeWidth={2} name="Net Payout" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center" data-testid="revenue-trend-empty">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No revenue data available for this period</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
