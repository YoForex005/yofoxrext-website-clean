'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Loader2, AlertTriangle, ShieldAlert, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  useModerationReports,
  useModerationActions,
  useSpamLogs,
  useModerationStats,
} from '@/hooks/useModeration';
import { ModerationStats } from '@/components/admin/ModerationStats';
import { ReportDetailsModal } from '@/components/admin/ReportDetailsModal';

export default function ModerationDashboard() {
  const [activeTab, setActiveTab] = useState('reports');
  const [reportFilter, setReportFilter] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Fetch data
  const { data: reports, isLoading: reportsLoading } = useModerationReports({
    status: reportFilter || undefined,
    reason: reasonFilter || undefined,
    limit: 50,
  });

  const { data: actions, isLoading: actionsLoading } = useModerationActions({ limit: 50 });
  const { data: spamLogs, isLoading: spamLogsLoading } = useSpamLogs({ limit: 50 });
  const { data: stats } = useModerationStats();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'destructive',
      reviewed: 'outline',
      resolved: 'default',
      dismissed: 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'outline'} data-testid={`badge-status-${status}`}>
        {status}
      </Badge>
    );
  };

  const getSpamScoreBadge = (score: number) => {
    if (score > 80) return <Badge variant="destructive">High ({score})</Badge>;
    if (score >= 50) return <Badge variant="outline">Medium ({score})</Badge>;
    return <Badge variant="secondary">Low ({score})</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="moderation-dashboard">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-8 w-8" />
          Moderation Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage reports, spam detection, and moderation actions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports" data-testid="tab-reports">
            Reports {stats?.pendingReports > 0 && `(${stats.pendingReports})`}
          </TabsTrigger>
          <TabsTrigger value="actions" data-testid="tab-actions">
            Actions
          </TabsTrigger>
          <TabsTrigger value="spam" data-testid="tab-spam">
            Spam Detection
          </TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-stats">
            Stats
          </TabsTrigger>
        </TabsList>

        {/* REPORTS TAB */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Reports</CardTitle>
              <CardDescription>Review and manage user-reported messages</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <Select value={reportFilter} onValueChange={setReportFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-reason-filter">
                    <SelectValue placeholder="Filter by reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Reasons</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="inappropriate">Inappropriate</SelectItem>
                    <SelectItem value="scam">Scam</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reports Table */}
              {reportsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : reports && reports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Message Preview</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report: any) => (
                      <TableRow key={report.id} data-testid={`report-row-${report.id}`}>
                        <TableCell className="max-w-xs truncate">
                          {report.message?.body?.substring(0, 100) || 'Message deleted'}
                        </TableCell>
                        <TableCell>{report.reporter?.username}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.reason}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell suppressHydrationWarning>
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReportId(report.id)}
                            data-testid={`button-view-report-${report.id}`}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No reports found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACTIONS TAB */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Actions</CardTitle>
              <CardDescription>View all moderation actions taken</CardDescription>
            </CardHeader>
            <CardContent>
              {actionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : actions && actions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Moderator</TableHead>
                      <TableHead>Action Type</TableHead>
                      <TableHead>Target Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actions.map((action: any) => (
                      <TableRow key={action.id} data-testid={`action-row-${action.id}`}>
                        <TableCell>{action.moderator?.username}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{action.actionType}</Badge>
                        </TableCell>
                        <TableCell>{action.targetType}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {action.reason || 'No reason provided'}
                        </TableCell>
                        <TableCell suppressHydrationWarning>
                          {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No actions found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SPAM DETECTION TAB */}
        <TabsContent value="spam" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spam Detection Logs</CardTitle>
              <CardDescription>
                Auto-refreshing spam detection logs (updates every 30 seconds)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {spamLogsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : spamLogs && spamLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sender</TableHead>
                      <TableHead>Spam Score</TableHead>
                      <TableHead>Detection Method</TableHead>
                      <TableHead>Action Taken</TableHead>
                      <TableHead>Flagged Keywords</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spamLogs.map((log: any) => (
                      <TableRow key={log.id} data-testid={`spam-log-${log.id}`}>
                        <TableCell>{log.sender?.username}</TableCell>
                        <TableCell>{getSpamScoreBadge(log.spamScore)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.detectionMethod}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{log.actionTaken || 'none'}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.flaggedKeywords?.join(', ') || 'None'}
                        </TableCell>
                        <TableCell suppressHydrationWarning>
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No spam logs found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* STATS TAB */}
        <TabsContent value="stats">
          <ModerationStats stats={stats} />
        </TabsContent>
      </Tabs>

      {/* Report Details Modal */}
      {selectedReportId && (
        <ReportDetailsModal
          reportId={selectedReportId}
          open={!!selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </div>
  );
}
