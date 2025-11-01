"use client";

import { useState } from "react";
import { Coins, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { withSweetsAccess } from "../../lib/sweetsAuth";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TransactionHistoryDrawer from "./TransactionHistoryDrawer";
import { GuestSweetsCTA } from "@/components/coins/GuestSweetsCTA";

interface CoinBalanceData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  weeklyEarned: number;
}

export default function CoinBalanceWidget() {
  const { user, isAuthenticated } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: balanceData, isLoading } = useQuery<CoinBalanceData>({
    queryKey: ["/api/sweets/balance/me"],
    enabled: !!user && isAuthenticated && !user.isBot,
    refetchInterval: 30000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Show CTA for non-authenticated users (conversion opportunity)
  if (!user || !isAuthenticated) {
    return <GuestSweetsCTA />;
  }

  // Check if user has access to sweets system (blocks bots and suspended users)
  if (!withSweetsAccess(user)) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2" data-testid="widget-coin-balance-loading">
        <Skeleton className="h-9 w-24 rounded-full dark:bg-gray-800" />
      </div>
    );
  }

  const balance = balanceData?.balance ?? 0;
  const weeklyEarned = balanceData?.weeklyEarned ?? 0;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 transition-all hover:shadow-lg dark:from-yellow-600 dark:to-yellow-700 dark:hover:from-yellow-700 dark:hover:to-yellow-800 group"
              data-testid="widget-coin-balance"
            >
              <Coins className="h-4 w-4 text-yellow-900 dark:text-yellow-100 group-hover:rotate-12 transition-transform" />
              <span className="font-semibold text-yellow-900 dark:text-yellow-100 hidden sm:inline" data-testid="text-coin-amount">
                {balance.toLocaleString()}
              </span>
              <span className="font-semibold text-yellow-900 dark:text-yellow-100 sm:hidden" data-testid="text-coin-amount-mobile">
                {balance.toLocaleString()}
              </span>
              {weeklyEarned > 0 && (
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] bg-yellow-600 text-yellow-100 border-0 hidden md:flex dark:bg-yellow-800 dark:text-yellow-200"
                >
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  +{weeklyEarned}
                </Badge>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
            <p className="text-sm">Click to view transactions</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TransactionHistoryDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
