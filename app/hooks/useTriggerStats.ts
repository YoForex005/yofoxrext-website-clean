import { useQuery } from "@tanstack/react-query";

export interface TriggerStat {
  trigger: string;
  channel: string;
  count: number;
  totalEarned: number;
  totalSpent: number;
  avgAmount: number;
}

export function useTriggerStats(days: number = 30) {
  return useQuery<TriggerStat[]>({
    queryKey: ["/api/admin/finance/trigger-stats", days],
    enabled: days > 0,
  });
}
