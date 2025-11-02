"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Folder, 
  Activity, 
  Users,
  MessageSquare,
  Eye,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { ForumThread, ForumCategory } from "@shared/schema";

interface TrendingThread extends ForumThread {}

interface PopularCategory {
  category: ForumCategory;
  threadCount: number;
}

interface RecentActivity {
  thread: ForumThread;
  author: {
    username: string;
    firstName?: string | null;
  };
}

interface CommunityStats {
  activeUsers: number;
  threadsToday: number;
  totalThreads: number;
  totalCategories: number;
}

export default function RightEngagementSidebar() {
  // Fetch trending threads
  const { data: trendingThreads, isLoading: loadingTrending } = useQuery<TrendingThread[]>({
    queryKey: ["/api/forum/trending"],
    queryFn: async () => {
      const res = await fetch("/api/forum/trending?hours=24&limit=7");
      if (!res.ok) throw new Error("Failed to fetch trending threads");
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch popular categories
  const { data: popularCategories, isLoading: loadingCategories } = useQuery<PopularCategory[]>({
    queryKey: ["/api/forum/popular-categories"],
    queryFn: async () => {
      const res = await fetch("/api/forum/popular-categories?limit=5");
      if (!res.ok) throw new Error("Failed to fetch popular categories");
      return res.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: loadingActivity } = useQuery<RecentActivity[]>({
    queryKey: ["/api/forum/recent-activity"],
    queryFn: async () => {
      const res = await fetch("/api/forum/recent-activity?limit=10");
      if (!res.ok) throw new Error("Failed to fetch recent activity");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch community stats
  const { data: stats, isLoading: loadingStats } = useQuery<CommunityStats>({
    queryKey: ["/api/forum/stats"],
    queryFn: async () => {
      const res = await fetch("/api/forum/stats");
      if (!res.ok) throw new Error("Failed to fetch community stats");
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return (
    <aside className="w-[320px] space-y-4" data-testid="sidebar-right">
      {/* Community Stats Card */}
      <Card data-testid="card-community-stats">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Community Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="space-y-3" data-testid="loading-stats">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-3" data-testid="stats-grid">
              <div className="text-center p-3 bg-muted/50 dark:bg-muted/20 rounded-lg" data-testid="stat-active-users">
                <p className="text-2xl font-bold text-foreground dark:text-foreground">{stats.activeUsers}</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Active Users</p>
              </div>
              <div className="text-center p-3 bg-muted/50 dark:bg-muted/20 rounded-lg" data-testid="stat-threads-today">
                <p className="text-2xl font-bold text-foreground dark:text-foreground">{stats.threadsToday}</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Today's Threads</p>
              </div>
              <div className="text-center p-3 bg-muted/50 dark:bg-muted/20 rounded-lg" data-testid="stat-total-threads">
                <p className="text-2xl font-bold text-foreground dark:text-foreground">{stats.totalThreads.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Total Threads</p>
              </div>
              <div className="text-center p-3 bg-muted/50 dark:bg-muted/20 rounded-lg" data-testid="stat-categories">
                <p className="text-2xl font-bold text-foreground dark:text-foreground">{stats.totalCategories}</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Categories</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground dark:text-muted-foreground text-center py-4" data-testid="stats-empty">
              No stats available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Trending Threads Card */}
      <Card data-testid="card-trending-threads">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            Trending Threads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTrending ? (
            <div className="space-y-3" data-testid="loading-trending">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : trendingThreads && trendingThreads.length > 0 ? (
            <div className="space-y-3" data-testid="trending-list">
              {trendingThreads.map((thread) => (
                <Link 
                  key={thread.id} 
                  href={`/thread/${thread.slug}`}
                  className="block group"
                  data-testid={`trending-thread-${thread.id}`}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground dark:text-foreground group-hover:text-primary dark:group-hover:text-primary line-clamp-2 transition-colors">
                      {thread.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {thread.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {thread.replyCount}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground dark:text-muted-foreground text-center py-4" data-testid="trending-empty">
              No trending threads yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Popular Categories Card */}
      <Card data-testid="card-popular-categories">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Folder className="h-4 w-4 text-purple-500" />
            Popular Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCategories ? (
            <div className="space-y-2" data-testid="loading-categories">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : popularCategories && popularCategories.length > 0 ? (
            <div className="space-y-2" data-testid="categories-list">
              {popularCategories.map((item) => (
                <Link
                  key={item.category.slug}
                  href={`/category/${item.category.slug}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
                  data-testid={`category-${item.category.slug}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">{item.category.icon}</span>
                    <span className="text-sm font-medium text-foreground dark:text-foreground truncate">
                      {item.category.name}
                    </span>
                  </div>
                  <Badge variant="secondary" className="ml-2 flex-shrink-0">
                    {item.threadCount}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground dark:text-muted-foreground text-center py-4" data-testid="categories-empty">
              No categories available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card data-testid="card-recent-activity">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingActivity ? (
            <div className="space-y-3" data-testid="loading-activity">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3" data-testid="activity-list">
              {recentActivity.map((item) => (
                <Link
                  key={item.thread.id}
                  href={`/thread/${item.thread.slug}`}
                  className="block group"
                  data-testid={`activity-${item.thread.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground dark:text-foreground group-hover:text-primary dark:group-hover:text-primary line-clamp-2 transition-colors flex-1">
                        {item.thread.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
                      <span className="font-medium">
                        {item.author.firstName || item.author.username}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.thread.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground dark:text-muted-foreground text-center py-4" data-testid="activity-empty">
              No recent activity
            </p>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
