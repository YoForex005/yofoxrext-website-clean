"use client";

import { AdminAuthCheck } from "@/admin/auth-check";
import { KPICard } from "@/components/admin/KPICard";
import { UserGrowthChart } from "@/components/admin/UserGrowthChart";
import { ContentTrendChart } from "@/components/admin/ContentTrendChart";
import { RevenueBreakdown } from "@/components/admin/RevenueBreakdown";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Users, Activity, FileText, Coins, CreditCard, MessageSquare, Reply, Star } from "lucide-react";
import { useEffect, useState } from "react";

function AdminOverviewContent() {
  const { data: stats, isLoading, isError, refetch } = useAdminStats();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      refetch();
    }, 60000);

    return () => clearInterval(interval);
  }, [refetch]);

  const formatRevenue = (coins: number) => {
    return `${coins.toLocaleString()} Sweets`;
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6" data-testid="admin-overview-page">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
            Admin Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="last-refresh">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        data-testid="kpi-cards-grid"
      >
        <KPICard
          title="Total Users"
          value={stats?.totalUsers.toLocaleString() || "0"}
          icon={Users}
          loading={isLoading}
          error={isError}
          trend={stats?.userGrowthPercent}
          trendLabel="this month"
          color="text-blue-500"
          data-testid="card-total-users"
        />

        <KPICard
          title="Active Users Today"
          value={stats?.activeUsersToday.toLocaleString() || "0"}
          icon={Activity}
          loading={isLoading}
          error={isError}
          color="text-green-500"
          data-testid="card-active-users"
        />

        <KPICard
          title="Total Content Items"
          value={stats?.totalContent.toLocaleString() || "0"}
          icon={FileText}
          loading={isLoading}
          error={isError}
          color="text-purple-500"
          data-testid="card-total-content"
        />

        <KPICard
          title="Total Revenue"
          value={stats ? formatRevenue(stats.totalRevenue) : "0 Sweets"}
          icon={Coins}
          loading={isLoading}
          error={isError}
          color="text-amber-500"
          data-testid="card-total-revenue"
        />

        <KPICard
          title="Total Transactions"
          value={stats?.totalTransactions.toLocaleString() || "0"}
          icon={CreditCard}
          loading={isLoading}
          error={isError}
          color="text-indigo-500"
          data-testid="card-total-transactions"
        />

        <KPICard
          title="Forum Threads"
          value={stats?.forumThreads.toLocaleString() || "0"}
          icon={MessageSquare}
          loading={isLoading}
          error={isError}
          color="text-cyan-500"
          data-testid="card-forum-threads"
        />

        <KPICard
          title="Forum Replies"
          value={stats?.forumReplies.toLocaleString() || "0"}
          icon={Reply}
          loading={isLoading}
          error={isError}
          color="text-pink-500"
          data-testid="card-forum-replies"
        />

        <KPICard
          title="Broker Reviews"
          value={stats?.brokerReviews.toLocaleString() || "0"}
          icon={Star}
          loading={isLoading}
          error={isError}
          color="text-orange-500"
          data-testid="card-broker-reviews"
        />
      </div>

      {/* Charts Row - User Growth (2/3) + Content Trends (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="charts-grid">
        <div className="lg:col-span-2">
          <UserGrowthChart />
        </div>
        <div className="lg:col-span-1">
          <ContentTrendChart />
        </div>
      </div>

      {/* Revenue Breakdown - Full Width */}
      <div data-testid="revenue-section">
        <RevenueBreakdown />
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <AdminAuthCheck>
      <AdminOverviewContent />
    </AdminAuthCheck>
  );
}
