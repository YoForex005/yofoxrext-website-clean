"use client";

import { KPICard } from "@/components/admin/KPICard";
import { Users, Star, Coins, ShieldAlert } from "lucide-react";
import { UserStats } from "@/hooks/useUserManagement";

interface UserManagementKPIsProps {
  stats?: UserStats;
  isLoading?: boolean;
}

export function UserManagementKPIs({ stats, isLoading }: UserManagementKPIsProps) {
  const formatNumber = (num: number) => num.toLocaleString();
  const formatDecimal = (num: number) => num.toFixed(1);
  const formatCoins = (num: number) => `${formatNumber(Math.round(num))} Sweets`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="user-kpis-grid">
      <KPICard
        title="Total Users"
        value={stats ? formatNumber(stats.totalUsers) : "0"}
        icon={Users}
        loading={isLoading}
        color="text-blue-500"
        data-testid="kpi-total-users"
      />

      <KPICard
        title="Avg Reputation"
        value={stats ? formatDecimal(stats.avgReputation) : "0.0"}
        icon={Star}
        loading={isLoading}
        color="text-yellow-500"
        data-testid="kpi-avg-reputation"
      />

      <KPICard
        title="Avg Coins"
        value={stats ? formatCoins(stats.avgCoins) : "0 Sweets"}
        icon={Coins}
        loading={isLoading}
        color="text-green-500"
        data-testid="kpi-avg-coins"
      />

      <KPICard
        title="Banned/Suspended"
        value={stats ? formatNumber(stats.bannedCount) : "0"}
        icon={ShieldAlert}
        loading={isLoading}
        color="text-red-500"
        data-testid="kpi-banned-count"
      />
    </div>
  );
}
