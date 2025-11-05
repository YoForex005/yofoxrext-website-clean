
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

  // Use data if available, regardless of mounted state for initial server data
  const stats = [
    { 
      label: "Forum Threads", 
      value: data?.totalThreads !== undefined ? data.totalThreads.toLocaleString('en-US') : "0", 
      icon: MessageSquare, 
      key: "threads" 
    },
    { 
      label: "Community Members", 
      // Fixed: Use totalMembers from the API response
      value: data?.totalMembers !== undefined ? data.totalMembers.toLocaleString('en-US') : "0", 
      icon: Users, 
      key: "members" 
    },
    { 
      label: "Total Replies", 
      value: data?.totalPosts !== undefined ? data.totalPosts.toLocaleString('en-US') : "0", 
      icon: MessagesSquare, 
      key: "replies" 
    },
    { 
      label: "Active Today", 
      value: data?.todayActivity?.threads !== undefined ? `+${data.todayActivity.threads}` : "+0", 
      icon: Activity, 
      key: "activity" 
    }
  ];

  if (isLoading && !data) {
    return (
      <div className="border-y bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 py-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted/50 rounded-sm px-2 py-1 animate-pulse">
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-muted rounded-sm h-5 w-5" />
                  <div className="h-3.5 w-10 bg-muted rounded mt-1" />
                  <div className="h-2.5 w-14 bg-muted rounded mt-0.5" />
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
      <div className="container max-w-7xl mx-auto px-4 py-1">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-muted-foreground">Platform Statistics</div>
          <RefreshButton 
            onRefresh={async () => { await refetch(); }}
            size="icon"
            variant="ghost"
            className="h-5 w-5 -mr-1"
          />
        </div>
        {/* Ultra-compact grid layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2">
          {stats.map((stat) => (
            <div key={stat.key} className="bg-card/50 hover:bg-card/70 transition-colors rounded-sm px-2 py-1">
              {/* Ultra-compact inline layout */}
              <div className="flex flex-col items-center justify-center text-center">
                {/* Tiny icon */}
                <div className="bg-primary/10 dark:bg-primary/20 rounded-sm p-1 flex items-center justify-center">
                  <stat.icon className="h-3 w-3 text-primary dark:text-primary" />
                </div>
                {/* Compact value text */}
                <div className="text-sm font-semibold leading-none mt-1" data-testid={`text-stat-${stat.key}`} suppressHydrationWarning>
                  {stat.value}
                </div>
                {/* Tiny label text */}
                <div className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
