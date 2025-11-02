"use client";

import { useRevenueBreakdown } from "@/hooks/useRevenueBreakdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { format } from "date-fns";
import { AlertCircle, RefreshCw, Trophy, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function RevenueBreakdown() {
  const { data, isLoading, isError, refetch, isRefetching } = useRevenueBreakdown();

  if (isLoading) {
    return (
      <Card className="w-full" data-testid="revenue-breakdown-loading">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full border-destructive" data-testid="revenue-breakdown-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Revenue Data
          </CardTitle>
          <CardDescription>Failed to load revenue breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            data-testid="button-retry-revenue"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="w-full" data-testid="revenue-breakdown-empty">
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>Revenue analytics and top performers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatSweets = (amount: number) => `${amount.toLocaleString()} Sweets`;
  
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatTransactionType = (type: string) => {
    const typeLabels: Record<string, string> = {
      recharge: 'Recharge',
      content_purchase: 'Content Sale',
      thread_creation: 'Thread Creation',
      reply_creation: 'Reply Creation',
      content_creation: 'Content Creation',
      daily_login: 'Daily Login',
      profile_completion: 'Profile Completion',
    };
    return typeLabels[type] || type;
  };

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const pieData = data.bySource.map((item) => ({
    name: formatTransactionType(item.source),
    value: item.amount,
  }));

  const totalRevenue = data.bySource.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="w-full" data-testid="revenue-breakdown">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Breakdown
            </CardTitle>
            <CardDescription>
              Total Revenue: {formatSweets(totalRevenue)}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            data-testid="button-refresh-revenue"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue by Source - Pie Chart */}
          <Card data-testid="card-revenue-by-source">
            <CardHeader>
              <CardTitle className="text-lg">Revenue by Source</CardTitle>
              <CardDescription>Breakdown by transaction type</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover border border-popover-border rounded-lg shadow-lg p-3">
                              <p className="text-sm font-medium text-popover-foreground">
                                {payload[0].name}
                              </p>
                              <p className="text-sm font-semibold" style={{ color: payload[0].payload.fill }}>
                                {formatSweets(Number(payload[0].value))}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top 10 Earners */}
          <Card data-testid="card-top-earners">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Top 10 Earners
              </CardTitle>
              <CardDescription>Users with highest total earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {data.topEarners.length > 0 ? (
                  data.topEarners.map((earner, index) => (
                    <div
                      key={earner.userId}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      data-testid={`top-earner-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={index < 3 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="font-medium text-sm">{earner.username}</span>
                      </div>
                      <span className="font-semibold text-sm text-primary">
                        {formatSweets(earner.totalEarnings)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                    No earners data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent High-Value Transactions */}
          <Card data-testid="card-recent-transactions">
            <CardHeader>
              <CardTitle className="text-lg">Recent High-Value Transactions</CardTitle>
              <CardDescription>Top 20 transactions by amount</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {data.recentTransactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">User</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id} data-testid={`transaction-${transaction.id}`}>
                          <TableCell className="text-xs">
                            <div>
                              <div className="font-medium">{transaction.username}</div>
                              <div className="text-muted-foreground text-[10px]">
                                {formatTransactionType(transaction.type)}
                              </div>
                              <div className="text-muted-foreground text-[10px]">
                                {formatDate(transaction.createdAt)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-primary">
                            {formatSweets(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                    No transactions available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
