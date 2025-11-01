'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  Users, 
  TrendingUp 
} from 'lucide-react';

interface ModerationStatsProps {
  stats?: {
    totalReports: number;
    pendingReports: number;
    resolvedReports: number;
    spamDetectedToday: number;
    actionsTakenToday: number;
    topReportedUsers: Array<{ userId: string; username: string; reportCount: number }>;
    commonReportReasons: Array<{ reason: string; count: number }>;
  };
}

export function ModerationStats({ stats }: ModerationStatsProps) {
  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading stats...
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="moderation-stats">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-reports">
              {stats.totalReports}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500" data-testid="stat-pending-reports">
              {stats.pendingReports}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Reports</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500" data-testid="stat-resolved-reports">
              {stats.resolvedReports}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spam Detected Today</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500" data-testid="stat-spam-today">
              {stats.spamDetectedToday}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Taken Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500" data-testid="stat-actions-today">
              {stats.actionsTakenToday}
            </div>
            <p className="text-xs text-muted-foreground">Moderation actions</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Reported Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Reported Users
          </CardTitle>
          <CardDescription>
            Users with the most reported messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topReportedUsers && stats.topReportedUsers.length > 0 ? (
            <div className="space-y-2">
              {stats.topReportedUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`top-user-${user.userId}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <Badge variant="destructive">{user.reportCount} reports</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No reported users</p>
          )}
        </CardContent>
      </Card>

      {/* Common Report Reasons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Common Report Reasons
          </CardTitle>
          <CardDescription>
            Most frequently reported violation types
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.commonReportReasons && stats.commonReportReasons.length > 0 ? (
            <div className="space-y-2">
              {stats.commonReportReasons.map((reason) => (
                <div
                  key={reason.reason}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`reason-${reason.reason}`}
                >
                  <span className="font-medium capitalize">{reason.reason}</span>
                  <Badge>{reason.count} reports</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No report reasons</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
