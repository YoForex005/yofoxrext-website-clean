"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Star, 
  Zap, 
  Lock, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  CreditCard,
  Award,
  Target,
  Gift
} from "lucide-react";
import type { RankTier, FeatureUnlock } from "@shared/schema";
import { TopUpModal } from "./TopUpModal";
import { WaysToEarnModal } from "./WaysToEarnModal";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// API Response Types
interface ProgressResponse {
  currentXp: number;
  weeklyXp: number;
  currentRank: RankTier;
  nextRank: RankTier | null;
  xpNeededForNext: number;
  featureUnlocks: FeatureUnlock[];
  weekStartDate: string;
  sweetsBalance: number;
}

// Rank color mapping
const RANK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  contributor: { 
    bg: "bg-slate-100 dark:bg-slate-900", 
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700"
  },
  explorer: { 
    bg: "bg-blue-100 dark:bg-blue-950", 
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-700"
  },
  expert: { 
    bg: "bg-purple-100 dark:bg-purple-950", 
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-700"
  },
  master: { 
    bg: "bg-amber-100 dark:bg-amber-950", 
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700"
  },
};

// Rank icon mapping
const RANK_ICONS: Record<string, typeof Trophy> = {
  contributor: Target,
  explorer: TrendingUp,
  expert: Star,
  master: Trophy,
};

export default function SweetsDashboardClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [earnModalOpen, setEarnModalOpen] = useState(false);

  // Fetch user progress
  const { 
    data: progress, 
    isLoading: progressLoading, 
    isFetching: progressFetching,
    error: progressError,
    refetch: refetchProgress 
  } = useQuery<ProgressResponse>({
    queryKey: ["/api/sweets/progress"],
    refetchInterval: 60000, // Auto-refresh every 60 seconds
  });

  // Fetch all ranks
  const { 
    data: ranks, 
    isLoading: ranksLoading, 
    error: ranksError,
    refetch: refetchRanks 
  } = useQuery<RankTier[]>({
    queryKey: ["/api/sweets/ranks"],
    refetchInterval: 60000,
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    // Connect to the API server (port 3001) for WebSocket
    const apiUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : 'http://localhost:3001';
      
    const socket: Socket = io(apiUrl, {
      path: '/ws/dashboard',
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[Sweets WS] Connected to WebSocket');
      socket.emit('join', user.id);
    });

    // Listen for XP awarded events
    socket.on('sweets:xp-awarded', (data: {
      userId: string;
      xpAwarded: number;
      newTotalXp: number;
      rankChanged: boolean;
      newRank?: RankTier;
      newlyUnlockedFeatures?: any[];
      timestamp: Date;
    }) => {
      console.log('[Sweets WS] XP awarded:', data);
      
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['/api/sweets/progress'] });
      
      // Show toast notification
      if (data.rankChanged && data.newRank) {
        // Trigger confetti for rank up!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#a78bfa', '#c4b5fd']
        });
        
        toast.success(`🎉 Rank Up! You're now a ${data.newRank.name}!`, {
          duration: 5000,
          description: `+${data.xpAwarded} XP earned`
        });
      } else {
        toast.success(`+${data.xpAwarded} XP earned!`, {
          description: `Total XP: ${data.newTotalXp?.toLocaleString() || '0'}`
        });
      }
    });

    // Listen for balance update events
    socket.on('sweets:balance-updated', (data: {
      userId: string;
      newBalance: number;
      change: number;
      timestamp: Date;
    }) => {
      console.log('[Sweets WS] Balance updated:', data);
      
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['/api/sweets/progress'] });
      
      // Show toast notification
      toast.success(`${data.change > 0 ? '+' : ''}${data.change} Sweets`, {
        description: `New balance: ${data.newBalance?.toLocaleString() || '0'}`
      });
    });

    socket.on('disconnect', () => {
      console.log('[Sweets WS] Disconnected from WebSocket');
    });

    socket.on('error', (error) => {
      console.error('[Sweets WS] WebSocket error:', error);
    });

    return () => {
      socket.off('sweets:xp-awarded');
      socket.off('sweets:balance-updated');
      socket.disconnect();
    };
  }, [user?.id, queryClient]);

  // Calculate days until weekly reset
  const getDaysUntilReset = () => {
    if (!progress?.weekStartDate) return 0;
    const weekStart = new Date(progress.weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const now = new Date();
    const daysRemaining = Math.ceil((weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  };

  // Error state - only show error if both queries failed
  if (progressError && ranksError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Zap className="h-12 w-12 text-destructive" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">Failed to load dashboard</p>
                <p className="text-sm text-muted-foreground">
                  {progressError?.message || ranksError?.message || "An error occurred"}
                </p>
              </div>
              <Button 
                onClick={() => {
                  refetchProgress();
                  refetchRanks();
                }}
                data-testid="button-retry"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate derived values only when data is available
  const currentRank = progress?.currentRank;
  const nextRank = progress?.nextRank;
  const xpProgress = nextRank && currentRank
    ? ((progress.currentXp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100
    : 100;
  const weeklyProgress = progress ? (progress.weeklyXp / 1000) * 100 : 0;
  
  // Get rank colors
  const rankKey = currentRank?.name?.toLowerCase() || 'contributor';
  const currentRankColors = RANK_COLORS[rankKey] || RANK_COLORS.contributor;
  const RankIcon = RANK_ICONS[rankKey] || Target;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sweets Dashboard</h1>
          <p className="text-muted-foreground">
            Track your XP, rank progress, and unlocked features
          </p>
        </div>
      </div>

      {/* A. Sweets Balance Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Sweets Balance
          </CardTitle>
          <CardDescription>Your current Sweets coin balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                {progressLoading ? (
                  <Skeleton className="h-10 w-24" data-testid="sweets-balance-skeleton" />
                ) : (
                  <>
                    <span className="text-4xl font-bold" data-testid="sweets-balance">
                      {progress?.sweetsBalance?.toLocaleString() ?? 0}
                    </span>
                    {progressFetching && !progressLoading && (
                      <span className="text-xs text-muted-foreground animate-pulse" data-testid="sweets-balance-updating">
                        updating...
                      </span>
                    )}
                  </>
                )}
                <span className="text-xl text-muted-foreground">Sweets</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Use Sweets to unlock premium content and features
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setTopUpModalOpen(true)}
                data-testid="button-topup"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Top Up
              </Button>
              <Button 
                onClick={() => setEarnModalOpen(true)}
                data-testid="button-earn"
              >
                <Zap className="h-4 w-4 mr-2" />
                Ways to Earn
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B. XP Progress Section & C. Weekly XP Tracker - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* B. XP Progress Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Rank Progress
            </CardTitle>
            <CardDescription>
              Your journey to the next rank
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {progressLoading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : progress ? (
              <>
                {/* Current Rank Badge */}
                <div className={`rounded-lg p-4 ${currentRankColors.bg} ${currentRankColors.border} border-2`}>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-3 bg-background ${currentRankColors.text}`}>
                      <RankIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Rank</p>
                      <p className={`text-xl font-bold ${currentRankColors.text}`} data-testid="text-current-rank">
                        {currentRank?.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* XP Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">XP Progress</span>
                    <span className="font-medium" data-testid="text-current-xp">
                      {progress.currentXp?.toLocaleString() || '0'} / {nextRank?.minXp?.toLocaleString() || "MAX"}
                    </span>
                  </div>
                  <Progress 
                    value={xpProgress} 
                    className="h-3"
                    data-testid="progress-xp"
                  />
                  {nextRank && (
                    <p className="text-xs text-muted-foreground" data-testid="text-xp-needed">
                      {progress.xpNeededForNext?.toLocaleString() || '0'} XP until {nextRank.name}
                    </p>
                  )}
                  {!nextRank && (
                    <p className="text-xs text-muted-foreground">
                      🎉 Maximum rank achieved!
                    </p>
                  )}
                </div>

                {/* Next Rank Preview */}
                {nextRank && (
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Next Rank</p>
                        <p className="text-sm font-semibold" data-testid="text-next-rank">{nextRank.name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* C. Weekly XP Tracker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly XP
            </CardTitle>
            <CardDescription>
              Track your weekly earning progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {progressLoading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : progress ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">This Week</span>
                    <span className="font-medium">
                      {progress.weeklyXp?.toLocaleString() || '0'} / 1,000 XP
                    </span>
                  </div>
                  <Progress 
                    value={weeklyProgress} 
                    className="h-3"
                    data-testid="progress-weekly"
                  />
                  <p className="text-xs text-muted-foreground">
                    {weeklyProgress >= 100 
                      ? "Weekly cap reached! Great job!" 
                      : `${(1000 - (progress.weeklyXp || 0)).toLocaleString()} XP remaining this week`
                    }
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium" data-testid="text-weekly-reset">Resets in {getDaysUntilReset()} days</p>
                      <p className="text-xs text-muted-foreground">
                        Weekly cap resets every Sunday
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Weekly Stats</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Earned</p>
                      <p className="text-lg font-bold" data-testid="text-weekly-xp-earned">{progress.weeklyXp || 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="text-lg font-bold" data-testid="text-weekly-xp-remaining">{Math.max(0, 1000 - (progress.weeklyXp || 0))}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* D. Rank Tiers Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Rank Tiers
          </CardTitle>
          <CardDescription>
            All available ranks and their requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ranksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : ranks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ranks.map((rank) => {
                const rankKey = rank.name.toLowerCase();
                const colors = RANK_COLORS[rankKey] || RANK_COLORS.contributor;
                const Icon = RANK_ICONS[rankKey] || Target;
                const isCurrent = rank.id === currentRank?.id;
                const isCompleted = progress && progress.currentXp >= rank.minXp && rank.id !== currentRank?.id;
                const isLocked = !progress || progress.currentXp < rank.minXp;

                return (
                  <div
                    key={rank.id}
                    data-testid={`rank-tier-${rank.id}`}
                    className={`rounded-lg border-2 p-4 transition-all ${
                      isCurrent 
                        ? `${colors.bg} ${colors.border} shadow-lg` 
                        : isCompleted
                        ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30"
                        : "border-muted bg-muted/30"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`rounded-full p-4 ${isCurrent ? 'bg-background' : 'bg-background/50'} ${colors.text}`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">{rank.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {rank.minXp?.toLocaleString() || '0'} XP
                          {rank.maxXp && ` - ${rank.maxXp?.toLocaleString() || '0'} XP`}
                        </p>
                      </div>
                      <Badge 
                        variant={isCurrent ? "default" : isCompleted ? "secondary" : "outline"}
                        className="w-full justify-center"
                      >
                        {isCurrent && <CheckCircle className="h-3 w-3 mr-1" />}
                        {isCompleted && <CheckCircle className="h-3 w-3 mr-1" />}
                        {isLocked && <Lock className="h-3 w-3 mr-1" />}
                        {isCurrent ? "Current" : isCompleted ? "Completed" : "Locked"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* E. Feature Unlocks Section & F. Achievements - Side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* E. Feature Unlocks Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Unlocked Features
            </CardTitle>
            <CardDescription>
              Features available at your current rank
            </CardDescription>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : progress ? (
              progress.featureUnlocks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No features unlocked yet</p>
                  <p className="text-sm">Earn XP to unlock features</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {progress.featureUnlocks.map((unlock) => (
                    <div
                      key={unlock.id}
                      data-testid={`feature-unlock-${unlock.id}`}
                      className="flex items-start gap-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-3"
                    >
                      <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{unlock.featureName}</h4>
                          <Badge variant="outline" className="ml-2 text-xs">
                            Unlocked
                          </Badge>
                        </div>
                        {unlock.featureDescription && (
                          <p className="text-xs text-muted-foreground">
                            {unlock.featureDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </CardContent>
        </Card>

        {/* F. Achievements (stub) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Achievements
            </CardTitle>
            <CardDescription>
              Track your milestones and accomplishments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="rounded-full bg-muted p-6">
                <Award className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">Achievements Coming Soon</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  We're working on a comprehensive achievement system to track your
                  milestones and reward your accomplishments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <TopUpModal open={topUpModalOpen} onOpenChange={setTopUpModalOpen} />
      <WaysToEarnModal open={earnModalOpen} onOpenChange={setEarnModalOpen} />
    </div>
  );
}

// Skeleton loading state
function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Skeleton className="h-12 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
