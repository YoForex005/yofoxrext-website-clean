"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye, MessageSquare, Flame } from "lucide-react";
import Link from "next/link";

interface TrendingThread {
  id: string;
  title: string;
  slug: string;
  views: number;
  replyCount: number;
  likeCount: number;
  author: {
    id: string;
    username: string;
    firstName?: string | null;
  };
}

export default function TrendingThreads() {
  const { data: trendingThreads, isLoading } = useQuery<TrendingThread[]>({
    queryKey: ["/api/threads/trending"],
    queryFn: async () => {
      const res = await fetch("/api/threads/trending?hours=168&limit=5");
      if (!res.ok) throw new Error("Failed to fetch trending threads");
      return res.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  return (
    <Card className="shadow-sm" data-testid="card-trending-threads">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Trending This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3" data-testid="loading-trending">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : trendingThreads && trendingThreads.length > 0 ? (
          <div className="space-y-3" data-testid="trending-list">
            {trendingThreads.map((thread, index) => (
              <Link
                key={thread.id}
                href={`/thread/${thread.slug}`}
                className="block group"
                data-testid={`trending-thread-${thread.id}`}
              >
                <div className="p-3 rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <Badge 
                      variant={index === 0 ? "default" : "secondary"}
                      className="mt-0.5 min-w-[24px] text-center"
                    >
                      {index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground dark:text-foreground group-hover:text-primary dark:group-hover:text-primary line-clamp-2 transition-colors">
                        {thread.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {thread.views > 1000 ? `${(thread.views / 1000).toFixed(1)}k` : thread.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {thread.replyCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          {Math.round(thread.views + thread.replyCount * 2 + thread.likeCount * 3)}
                        </span>
                      </div>
                    </div>
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
  );
}