"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign, 
  Activity, 
  Download,
  BarChart3,
  UserPlus,
  MessageSquare
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { AdminAuthCheck } from "../auth-check";
import { format } from "date-fns";

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch analytics stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/analytics/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user growth data
  const { data: userGrowthData, isLoading: userGrowthLoading } = useQuery({
    queryKey: ["/api/admin/analytics/user-growth"],
  });

  // Fetch content trends
  const { data: contentTrends, isLoading: contentTrendsLoading } = useQuery({
    queryKey: ["/api/admin/analytics/content-trends"],
  });

  // Fetch revenue data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/admin/analytics/revenue"],
  });

  // Fetch engagement metrics
  const { data: engagementData, isLoading: engagementLoading } = useQuery({
    queryKey: ["/api/admin/analytics/engagement"],
  });

  // Fetch users analytics
  const { data: usersAnalytics, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/analytics/users"],
  });

  // Fetch content analytics
  const { data: contentAnalytics, isLoading: contentLoading } = useQuery({
    queryKey: ["/api/admin/analytics/content"],
  });

  // Fetch financial analytics
  const { data: financialAnalytics, isLoading: financialLoading } = useQuery({
    queryKey: ["/api/admin/analytics/financial"],
  });

  const handleExportData = () => {
    const dataToExport = {
      stats,
      userGrowth: userGrowthData,
      contentTrends,
      revenue: revenueData,
      engagement: engagementData,
      timestamp: new Date().toISOString(),
    };

    const csv = convertToCSV(dataToExport);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any) => {
    const rows: string[][] = [];
    
    // Add stats
    if (data.stats) {
      rows.push(["Metric", "Value"]);
      Object.entries(data.stats).forEach(([key, value]) => {
        rows.push([key, String(value)]);
      });
    }

    return rows.map(row => row.join(",")).join("\n");
  };

  return (
    <AdminAuthCheck>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <BarChart3 className="h-8 w-8" />
              Analytics & Reports
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-page-description">
              Comprehensive platform analytics and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]" data-testid="select-date-range">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7" data-testid="option-range-7">Last 7 days</SelectItem>
                <SelectItem value="30" data-testid="option-range-30">Last 30 days</SelectItem>
                <SelectItem value="90" data-testid="option-range-90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportData} variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="p-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-full mt-2" />
                </CardHeader>
              </Card>
            ))
          ) : (
            <>
              <Card data-testid="card-total-users">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-users">
                    {(stats as any)?.totalUsers?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(stats as any)?.activeUsersToday?.toLocaleString() || 0} active today
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-total-content">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-content">
                    {(stats as any)?.totalContent?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All content items
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-total-revenue">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-revenue">
                    {(stats as any)?.totalRevenue?.toLocaleString() || 0} coins
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(stats as any)?.totalTransactions?.toLocaleString() || 0} transactions
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-forum-threads">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Forum Activity</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-forum-threads">
                    {(stats as any)?.forumThreads?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(stats as any)?.forumReplies?.toLocaleString() || 0} replies
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs for different analytics views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
            <TabsTrigger value="financial" data-testid="tab-financial">Financial</TabsTrigger>
            <TabsTrigger value="engagement" data-testid="tab-engagement">Engagement</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4" data-testid="tab-content-overview">
            <div className="grid gap-4 md:grid-cols-2">
              {/* User Growth Chart */}
              <Card data-testid="card-user-growth">
                <CardHeader>
                  <CardTitle>User Growth (Last 30 Days)</CardTitle>
                  <CardDescription>Daily user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  {userGrowthLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={(userGrowthData as any)?.data || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => format(new Date(value), "MMM d")}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="users" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="New Users"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Content Creation Trends */}
              <Card data-testid="card-content-trends">
                <CardHeader>
                  <CardTitle>Content Trends (Last 30 Days)</CardTitle>
                  <CardDescription>Content creation by type</CardDescription>
                </CardHeader>
                <CardContent>
                  {contentTrendsLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={(contentTrends as any)?.data || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => format(new Date(value), "MMM d")}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="ea" fill="#3b82f6" name="EAs" />
                        <Bar dataKey="indicator" fill="#10b981" name="Indicators" />
                        <Bar dataKey="article" fill="#f59e0b" name="Articles" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4" data-testid="tab-content-users">
            <Card>
              <CardHeader>
                <CardTitle>User Analytics</CardTitle>
                <CardDescription>Detailed user metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="border rounded p-4">
                        <div className="text-sm text-muted-foreground">Total Users</div>
                        <div className="text-2xl font-bold">{(usersAnalytics as any)?.totalUsers || 0}</div>
                      </div>
                      <div className="border rounded p-4">
                        <div className="text-sm text-muted-foreground">Active Today</div>
                        <div className="text-2xl font-bold">{(usersAnalytics as any)?.activeToday || 0}</div>
                      </div>
                      <div className="border rounded p-4">
                        <div className="text-sm text-muted-foreground">New This Month</div>
                        <div className="text-2xl font-bold">{(usersAnalytics as any)?.newThisMonth || 0}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4" data-testid="tab-content-content">
            <Card>
              <CardHeader>
                <CardTitle>Content Analytics</CardTitle>
                <CardDescription>Content performance and distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {contentLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="border rounded p-4">
                        <div className="text-sm text-muted-foreground">Total Posts</div>
                        <div className="text-2xl font-bold">{(contentAnalytics as any)?.totalPosts || 0}</div>
                      </div>
                      <div className="border rounded p-4">
                        <div className="text-sm text-muted-foreground">Published</div>
                        <div className="text-2xl font-bold">{(contentAnalytics as any)?.published || 0}</div>
                      </div>
                      <div className="border rounded p-4">
                        <div className="text-sm text-muted-foreground">Pending</div>
                        <div className="text-2xl font-bold">{(contentAnalytics as any)?.pending || 0}</div>
                      </div>
                      <div className="border rounded p-4">
                        <div className="text-sm text-muted-foreground">Total Views</div>
                        <div className="text-2xl font-bold">{(contentAnalytics as any)?.totalViews || 0}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4" data-testid="tab-content-financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial Analytics</CardTitle>
                <CardDescription>Revenue and transaction insights</CardDescription>
              </CardHeader>
              <CardContent>
                {financialLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="border rounded p-4">
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                        <div className="text-2xl font-bold">{(financialAnalytics as any)?.totalRevenue?.toLocaleString() || 0} coins</div>
                      </div>
                      <div className="border rounded p-4">
                        <div className="text-sm text-muted-foreground">Transactions</div>
                        <div className="text-2xl font-bold">{(financialAnalytics as any)?.transactions || 0}</div>
                      </div>
                      <div className="border rounded p-4">
                        <div className="text-sm text-muted-foreground">Avg Transaction</div>
                        <div className="text-2xl font-bold">{(financialAnalytics as any)?.avgTransaction || 0} coins</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-4" data-testid="tab-content-engagement">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>User activity and interaction patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {engagementLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="border rounded p-4" data-testid="card-dau">
                        <div className="text-sm text-muted-foreground">DAU</div>
                        <div className="text-2xl font-bold" data-testid="text-dau">
                          {(engagementData as any)?.dau?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div className="border rounded p-4" data-testid="card-mau">
                        <div className="text-sm text-muted-foreground">MAU</div>
                        <div className="text-2xl font-bold" data-testid="text-mau">
                          {(engagementData as any)?.mau?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div className="border rounded p-4" data-testid="card-avg-session">
                        <div className="text-sm text-muted-foreground">Avg Session</div>
                        <div className="text-2xl font-bold" data-testid="text-avg-session">
                          {(engagementData as any)?.avgSessionDuration || 0} min
                        </div>
                      </div>
                      <div className="border rounded p-4" data-testid="card-engagement-rate">
                        <div className="text-sm text-muted-foreground">Engagement Rate</div>
                        <div className="text-2xl font-bold" data-testid="text-engagement-rate">
                          {(engagementData as any)?.engagementRate || 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminAuthCheck>
  );
}
