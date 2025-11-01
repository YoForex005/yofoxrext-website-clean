
"use client";

import * as React from "react";
import { MessageSquare, Users, MessagesSquare, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { RefreshButton } from "./RefreshButton";

interface StatsData {
  totalThreads: number;
  totalMembers: number;
  totalPosts: number;
  todayActivity: {
    threads: number;
    content: number;
  };
}

interface StatsBarProps {
  initialStats?: StatsData;
}

export default function StatsBar({ initialStats }: StatsBarProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use React Query with initial data from server
  const { data, isLoading, refetch } = useQuery<StatsData>({
    queryKey: ['/api/stats'],
    initialData: initialStats,
    enabled: mounted, // Only fetch after mounting
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use mounted state to control stat value rendering
  const stats = [
    { 
      label: "Forum Threads", 
      value: mounted && data?.totalThreads ? data.totalThreads.toLocaleString('en-US') : "0", 
      icon: MessageSquare, 
      key: "threads" 
    },
    { 
      label: "Community Members", 
      value: mounted && data?.totalMembers ? data.totalMembers.toLocaleString('en-US') : "0", 
      icon: Users, 
      key: "members" 
    },
    { 
      label: "Total Replies", 
      value: mounted && data?.totalPosts ? data.totalPosts.toLocaleString('en-US') : "0", 
      icon: MessagesSquare, 
      key: "replies" 
    },
    { 
      label: "Active Today", 
      value: mounted && data?.todayActivity?.threads ? `+${data.todayActivity.threads}` : "+0", 
      icon: Activity, 
      key: "activity" 
    }
  ];

  if (isLoading && !data) {
    return (
      <div className="border-y bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="bg-muted rounded-lg h-11 w-11" />
                <div className="space-y-2">
                  <div className="h-8 w-20 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-y bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-muted-foreground">Platform Statistics</div>
          <RefreshButton 
            onRefresh={async () => { await refetch(); }}
            size="icon"
            variant="ghost"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.key} className="flex items-center gap-3">
              <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-2.5">
                <stat.icon className="h-5 w-5 text-primary dark:text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid={`text-stat-${stat.key}`} suppressHydrationWarning>
                  {mounted ? stat.value : "0"}
                </div>
                <div className="text-sm text-muted-foreground font-medium truncate">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
