'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Hook for fetching moderation reports
export function useModerationReports(filters?: { status?: string; reason?: string; limit?: number }) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.reason) queryParams.append('reason', filters.reason);
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  return useQuery({
    queryKey: ['/api/admin/moderation/reports', filters],
    queryFn: async () => {
      const url = `/api/admin/moderation/reports?${queryParams.toString()}`;
      return await fetch(url, { credentials: 'include' }).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch reports');
        return res.json();
      });
    },
  });
}

// Hook for fetching a single report
export function useModerationReport(reportId?: string) {
  return useQuery({
    queryKey: ['/api/admin/moderation/reports', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      return await fetch(`/api/admin/moderation/reports/${reportId}`, {
        credentials: 'include',
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch report');
        return res.json();
      });
    },
    enabled: !!reportId,
  });
}

// Hook for updating report status
export function useUpdateReportStatus() {
  return useMutation({
    mutationFn: async ({
      reportId,
      status,
      resolution,
    }: {
      reportId: string;
      status: string;
      resolution?: string;
    }) => {
      const response = await fetch(`/api/admin/moderation/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, resolution }),
      });
      if (!response.ok) throw new Error('Failed to update report');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/stats'] });
    },
  });
}

// Hook for creating moderation action
export function useCreateModerationAction() {
  return useMutation({
    mutationFn: async (action: {
      targetType: string;
      targetId: string;
      actionType: string;
      reason?: string;
      duration?: number;
    }) => {
      const response = await fetch('/api/admin/moderation/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(action),
      });
      if (!response.ok) throw new Error('Failed to create action');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/actions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/stats'] });
    },
  });
}

// Hook for fetching moderation actions
export function useModerationActions(filters?: {
  targetType?: string;
  moderatorId?: string;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.targetType) queryParams.append('targetType', filters.targetType);
  if (filters?.moderatorId) queryParams.append('moderatorId', filters.moderatorId);
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  return useQuery({
    queryKey: ['/api/admin/moderation/actions', filters],
    queryFn: async () => {
      const url = `/api/admin/moderation/actions?${queryParams.toString()}`;
      return await fetch(url, { credentials: 'include' }).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch actions');
        return res.json();
      });
    },
  });
}

// Hook for fetching spam detection logs
export function useSpamLogs(filters?: {
  senderId?: string;
  spamScoreMin?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.senderId) queryParams.append('senderId', filters.senderId);
  if (filters?.spamScoreMin !== undefined)
    queryParams.append('spamScoreMin', filters.spamScoreMin.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  return useQuery({
    queryKey: ['/api/admin/moderation/spam-logs', filters],
    queryFn: async () => {
      const url = `/api/admin/moderation/spam-logs?${queryParams.toString()}`;
      return await fetch(url, { credentials: 'include' }).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch spam logs');
        return res.json();
      });
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

// Hook for fetching moderation stats
export function useModerationStats() {
  return useQuery({
    queryKey: ['/api/admin/moderation/stats'],
    queryFn: async () => {
      return await fetch('/api/admin/moderation/stats', {
        credentials: 'include',
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      });
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
