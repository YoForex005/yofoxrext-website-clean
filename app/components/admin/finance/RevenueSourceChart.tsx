"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { RevenueSourceData } from "@/hooks/useRevenueSources";
import { PieChart as PieChartIcon } from "lucide-react";

interface RevenueSourceChartProps {
  data?: RevenueSourceData[];
  isLoading?: boolean;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];

export function RevenueSourceChart({ data, isLoading }: RevenueSourceChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700" data-testid="revenue-source-loading">
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
    <Card className="bg-gray-800 border-gray-700" data-testid="revenue-source-chart">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-blue-500" />
          Revenue by Source
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="source"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.source}: $${entry.amount.toLocaleString()}`}
                labelLine={{ stroke: '#9CA3AF' }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#FFF',
                }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend wrapperStyle={{ color: '#9CA3AF' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center" data-testid="revenue-source-empty">
            <div className="text-center">
              <PieChartIcon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No revenue source data available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
