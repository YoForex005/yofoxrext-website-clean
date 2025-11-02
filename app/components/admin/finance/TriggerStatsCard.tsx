"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TriggerStat {
  trigger: string;
  channel: string;
  count: number;
  totalEarned: number;
  totalSpent: number;
  avgAmount: number;
}

interface TriggerStatsCardProps {
  data?: TriggerStat[];
  isLoading?: boolean;
}

const CHANNEL_COLORS: Record<string, string> = {
  forum: "bg-blue-500",
  marketplace: "bg-green-500",
  onboarding: "bg-purple-500",
  referral: "bg-pink-500",
  engagement: "bg-yellow-500",
  treasury: "bg-red-500",
  admin: "bg-orange-500",
  system: "bg-gray-500",
};

const formatTrigger = (trigger: string): string => {
  const parts = trigger.split('.');
  return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' → ');
};

export function TriggerStatsCard({ data, isLoading }: TriggerStatsCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700" data-testid="trigger-stats-loading">
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-gray-700" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full bg-gray-700" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data && data.length > 0;

  return (
    <Card className="bg-gray-800 border-gray-700" data-testid="trigger-stats-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Transaction Sources (by Trigger)
        </CardTitle>
        <p className="text-sm text-gray-400 mt-1">
          Breakdown of coin transactions by earning/spending source
        </p>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Trigger</TableHead>
                  <TableHead className="text-gray-400">Channel</TableHead>
                  <TableHead className="text-gray-400 text-right">Count</TableHead>
                  <TableHead className="text-gray-400 text-right">Earned</TableHead>
                  <TableHead className="text-gray-400 text-right">Spent</TableHead>
                  <TableHead className="text-gray-400 text-right">Avg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((stat, index) => (
                  <TableRow key={index} className="border-gray-700">
                    <TableCell className="text-white font-medium">
                      {formatTrigger(stat.trigger)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`${CHANNEL_COLORS[stat.channel] || 'bg-gray-500'} text-white`}
                        data-testid={`badge-channel-${stat.channel}`}
                      >
                        {stat.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300 text-right">
                      {stat.count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-green-400 text-right">
                      +{stat.totalEarned.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-red-400 text-right">
                      {stat.totalSpent.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-gray-300 text-right">
                      {stat.avgAmount.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center" data-testid="trigger-stats-empty">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No transaction data available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
