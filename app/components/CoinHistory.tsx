"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CoinTransaction {
  id: string;
  type: "earn" | "spend" | "recharge";
  amount: number;
  description: string;
  status: "completed" | "pending" | "failed";
  createdAt: Date;
  botId?: string;
  metadata?: any;
}

export default function CoinHistory() {
  const { user } = useAuth();
  
  const { data: transactions, isLoading } = useQuery<CoinTransaction[]>({
    queryKey: ["/api/user", user?.id, "transactions"],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const res = await fetch(`/api/user/${user.id}/transactions?limit=50`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch coin transactions");
      return res.json();
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card data-testid="card-coin-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Recent Coin Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card data-testid="card-coin-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Recent Coin Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Coins className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No coin transactions yet</p>
            <p className="text-sm">Start earning by contributing to the community!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-coin-history">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Recent Coin Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isEarn = tx.type === "earn" || (tx.type === "recharge" && tx.amount > 0);
              const isSpend = tx.type === "spend" || tx.amount < 0;
              const isPending = tx.status === "pending";
              const isFailed = tx.status === "failed";

              return (
                <div
                  key={tx.id}
                  className={`flex items-start justify-between p-3 rounded-lg border transition-colors ${
                    isPending
                      ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
                      : isFailed
                      ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                      : isEarn
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                      : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                  }`}
                  data-testid={`transaction-${tx.id}`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`p-2 rounded-full ${
                        isEarn
                          ? "bg-green-100 dark:bg-green-900"
                          : "bg-blue-100 dark:bg-blue-900"
                      }`}
                    >
                      {isEarn ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight" data-testid="text-transaction-description">
                        {tx.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                      </p>
                      {tx.botId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          🤖 Bot transaction
                        </p>
                      )}
                      {isPending && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                          Pending
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`font-bold text-sm ${
                        isEarn
                          ? "text-green-600 dark:text-green-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                      data-testid="text-transaction-amount"
                    >
                      {isEarn ? "+" : ""}
                      {Math.abs(tx.amount).toLocaleString()}
                    </span>
                    <Coins className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
