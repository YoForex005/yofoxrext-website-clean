"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Activity, 
  BarChart, 
  Mail,
  TrendingUp,
  MessageSquare,
  Award,
  Clock
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import RelatedThreads from "./RelatedThreads";
import TrendingThreads from "./TrendingThreads";
import { formatDistanceToNow } from "date-fns";

interface TopContributor {
  userId: string;
  username: string;
  firstName?: string | null;
  avatarUrl?: string | null;
  threadCount: number;
  totalViews: number;
  totalLikes: number;
}

interface CategoryStats {
  totalThreads: number;
  activeToday: number;
  totalMembers: number;
  recentActivity: Array<{
    type: string;
    user: string;
    timestamp: Date;
  }>;
}

interface RightSidebarProps {
  threadId: string;
  categorySlug: string;
}

export default function RightSidebar({ threadId, categorySlug }: RightSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  // Fetch top contributors
  const { data: contributors, isLoading: loadingContributors } = useQuery<TopContributor[]>({
    queryKey: ["/api/categories", categorySlug, "contributors"],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${categorySlug}/contributors?limit=5`);
      if (!res.ok) throw new Error("Failed to fetch contributors");
      return res.json();
    },
  });

  // Fetch category stats (mock data for now)
  const categoryStats: CategoryStats = {
    totalThreads: 1234,
    activeToday: 89,
    totalMembers: 5678,
    recentActivity: [
      { type: "reply", user: "JohnDoe", timestamp: new Date(Date.now() - 5 * 60000) },
      { type: "thread", user: "JaneSmith", timestamp: new Date(Date.now() - 15 * 60000) },
      { type: "like", user: "BobTrader", timestamp: new Date(Date.now() - 30 * 60000) },
    ]
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribing(true);
    
    try {
      // TODO: Implement newsletter subscription API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Successfully subscribed!",
        description: "You'll receive our weekly digest of top threads",
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <aside className="space-y-4" data-testid="right-sidebar">
      {/* Related Threads */}
      <RelatedThreads threadId={threadId} />
      
      {/* Trending Threads */}
      <TrendingThreads />

      {/* Top Contributors */}
      <Card className="shadow-sm" data-testid="card-top-contributors">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-500" />
            Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingContributors ? (
            <div className="space-y-3" data-testid="loading-contributors">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : contributors && contributors.length > 0 ? (
            <div className="space-y-3" data-testid="contributors-list">
              {contributors.map((contributor, index) => (
                <Link
                  key={contributor.userId}
                  href={`/user/${contributor.username}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors group"
                  data-testid={`contributor-${contributor.userId}`}
                >
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback className="text-xs">
                      {(contributor.firstName || contributor.username).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground dark:text-foreground group-hover:text-primary dark:group-hover:text-primary truncate">
                      {contributor.firstName || contributor.username}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      {contributor.threadCount} threads • {contributor.totalViews > 1000 ? `${(contributor.totalViews / 1000).toFixed(1)}k` : contributor.totalViews} views
                    </p>
                  </div>
                  {index === 0 && (
                    <Badge variant="default" className="ml-auto">
                      #1
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground dark:text-muted-foreground text-center py-4" data-testid="contributors-empty">
              No contributors yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="shadow-sm" data-testid="card-quick-stats">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart className="h-4 w-4 text-green-500" />
            Category Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <p className="text-2xl font-bold text-foreground dark:text-foreground">{categoryStats.totalThreads}</p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">Total Threads</p>
            </div>
            <div className="p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <p className="text-2xl font-bold text-foreground dark:text-foreground">{categoryStats.activeToday}</p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">Active Today</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase">
              Recent Activity
            </p>
            {categoryStats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground dark:text-foreground font-medium">{activity.user}</span>
                <span className="text-muted-foreground dark:text-muted-foreground">
                  {activity.type === "reply" && "replied to a thread"}
                  {activity.type === "thread" && "started a thread"}
                  {activity.type === "like" && "liked a post"}
                </span>
                <span className="text-muted-foreground dark:text-muted-foreground ml-auto">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Newsletter Signup (only for non-logged in users) */}
      {!user && (
        <Card className="shadow-sm border-primary/20 bg-primary/5" data-testid="card-newsletter">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Weekly Digest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
              Get the best threads delivered to your inbox every week
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={subscribing}
                data-testid="input-newsletter-email"
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={subscribing}
                data-testid="button-newsletter-subscribe"
              >
                {subscribing ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </aside>
  );
}