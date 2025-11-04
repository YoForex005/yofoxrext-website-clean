
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
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-4 animate-pulse">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="bg-muted rounded-lg h-12 w-12" />
                  <div className="h-8 w-16 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
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
        {/* Fixed: Using consistent grid layout with proper alignment */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.key} className="bg-card/50 hover:bg-card/70 transition-colors rounded-lg p-4">
              {/* Fixed: Center-aligned content with consistent spacing */}
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                {/* Icon container with consistent sizing */}
                <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-3 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary dark:text-primary" />
                </div>
                {/* Value with consistent sizing */}
                <div className="text-2xl font-bold leading-tight" data-testid={`text-stat-${stat.key}`} suppressHydrationWarning>
                  {stat.value}
                </div>
                {/* Label with consistent styling */}
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
