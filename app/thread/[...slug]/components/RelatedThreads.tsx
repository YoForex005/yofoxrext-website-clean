"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageSquare, ThumbsUp, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface RelatedThread {
  id: string;
  title: string;
  slug: string;
  views: number;
  replyCount: number;
  likeCount: number;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    firstName?: string | null;
  };
}

interface RelatedThreadsProps {
  threadId: string;
}

export default function RelatedThreads({ threadId }: RelatedThreadsProps) {
  const { data: relatedThreads, isLoading } = useQuery<RelatedThread[]>({
    queryKey: ["/api/threads", threadId, "related"],
    queryFn: async () => {
      const res = await fetch(`/api/threads/${threadId}/related?limit=5`);
      if (!res.ok) throw new Error("Failed to fetch related threads");
      return res.json();
    },
  });

  return (
    <Card className="shadow-sm" data-testid="card-related-threads">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-blue-500" />
          Related Threads
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3" data-testid="loading-related">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : relatedThreads && relatedThreads.length > 0 ? (
          <div className="space-y-3" data-testid="related-list">
            {relatedThreads.map((thread) => (
              <Link
                key={thread.id}
                href={`/thread/${thread.slug}`}
                className="block group"
                data-testid={`related-thread-${thread.id}`}
              >
                <div className="p-3 rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors">
                  <h4 className="text-sm font-medium text-foreground dark:text-foreground group-hover:text-primary dark:group-hover:text-primary line-clamp-2 transition-colors">
                    {thread.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="font-medium">
                      {thread.author.firstName || thread.author.username}
                    </span>
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
          <p className="text-sm text-muted-foreground dark:text-muted-foreground text-center py-4" data-testid="related-empty">
            No related threads found
          </p>
        )}
      </CardContent>
    </Card>
  );
}