"use client";

import { TrendingUp, MessageSquare, Coins, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { withSweetsAccess } from "../../lib/sweetsAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { GuestSweetsCTA } from "@/components/coins/GuestSweetsCTA";

interface ActivityStats {
  weeklyPosts: number;
  weeklyReplies: number;
  weeklyCoins: number;
  currentTier: number;
  nextTierProgress: number;
  nextTierName: string;
}

export default function ActivitySummary() {
  const { user, isAuthenticated } = useAuth();

  const { data: stats, isLoading } = useQuery<ActivityStats>({
    queryKey: ["/api/user/activity-stats", user?.id],
    enabled: !!user && isAuthenticated && !user.isBot,
    refetchOnWindowFocus: false,
  });

  // Show CTA for non-authenticated users (conversion opportunity)
  if (!user || !isAuthenticated) {
    return <GuestSweetsCTA />;
  }

  // Check if user has access to sweets system (blocks bots and suspended users)
  if (!withSweetsAccess(user)) return null;

  if (isLoading) {
    return (
      <Card className="dark:bg-gray-900 dark:border-gray-800" data-testid="widget-activity-summary-loading">
        <CardHeader>
          <CardTitle className="text-sm font-medium dark:text-white">Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full dark:bg-gray-800" />
          <Skeleton className="h-4 w-3/4 dark:bg-gray-800" />
          <Skeleton className="h-2 w-full dark:bg-gray-800" />
        </CardContent>
      </Card>
    );
  }

  const weeklyPosts = stats?.weeklyPosts ?? 0;
  const weeklyReplies = stats?.weeklyReplies ?? 0;
  const weeklyCoins = stats?.weeklyCoins ?? 0;
  const nextTierProgress = stats?.nextTierProgress ?? 0;
  const nextTierName = stats?.nextTierName ?? "Silver";

  const getEncouragementMessage = () => {
    if (weeklyPosts === 0 && weeklyReplies === 0) {
      return "Start posting to earn coins this week!";
    }
    if (weeklyPosts > 0 && weeklyPosts < 3) {
      return `You posted ${weeklyPosts}x this week – keep it up!`;
    }
    if (weeklyPosts >= 3 && weeklyPosts < 7) {
      return `Great work! ${weeklyPosts} posts this week 🔥`;
    }
    if (weeklyPosts >= 7) {
      return `Amazing! ${weeklyPosts} posts this week 🌟`;
    }
    return "Keep contributing to the community!";
  };

  return (
    <Card className="dark:bg-gray-900 dark:border-gray-800" data-testid="widget-activity-summary">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 dark:text-white">
          <TrendingUp className="h-4 w-4 text-primary" />
          Weekly Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Encouragement Message */}
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          {getEncouragementMessage()}
        </p>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Posts</span>
            </div>
            <span className="font-semibold dark:text-white" data-testid="text-weekly-posts">
              {weeklyPosts}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Coins className="h-3.5 w-3.5 text-yellow-500" />
              <span>Coins Earned</span>
            </div>
            <span className="font-semibold text-yellow-600 dark:text-yellow-400" data-testid="text-weekly-coins">
              +{weeklyCoins}
            </span>
          </div>
        </div>

        {/* Tier Progress */}
        <div className="space-y-2 pt-2 border-t dark:border-gray-800">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Star className="h-3.5 w-3.5 text-purple-500" />
              <span>Next Tier</span>
            </div>
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {nextTierName}
            </span>
          </div>
          <div className="space-y-1">
            <Progress
              value={nextTierProgress}
              className="h-1.5 dark:bg-gray-800"
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-500 text-right">
              {nextTierProgress}% complete
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
