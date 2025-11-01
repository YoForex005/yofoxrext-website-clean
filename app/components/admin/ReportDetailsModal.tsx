'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ShieldAlert, Trash, Ban, AlertTriangle } from 'lucide-react';
import {
  useModerationReport,
  useUpdateReportStatus,
  useCreateModerationAction,
} from '@/hooks/useModeration';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ReportDetailsModalProps {
  reportId: string;
  open: boolean;
  onClose: () => void;
}

export function ReportDetailsModal({ reportId, open, onClose }: ReportDetailsModalProps) {
  const [resolution, setResolution] = useState('');
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<string>('');
  
  const { toast } = useToast();
  const { data: report, isLoading } = useModerationReport(reportId);
  const updateStatus = useUpdateReportStatus();
  const createAction = useCreateModerationAction();

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({
        reportId,
        status: newStatus,
        resolution: resolution || undefined,
      });
      toast({
        title: 'Report Updated',
        description: `Report marked as ${newStatus}`,
      });
      if (newStatus === 'resolved' || newStatus === 'dismissed') {
        onClose();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update report',
        variant: 'destructive',
      });
    }
  };

  const handleModeration = (action: string) => {
    setConfirmationAction(action);
    setShowConfirmation(true);
  };

  const confirmModeration = async () => {
    if (!report) return;

    try {
      let targetType = 'message';
      let targetId = report.messageId;

      if (confirmationAction === 'ban' || confirmationAction === 'suspend') {
        targetType = 'user';
        targetId = report.message?.senderId || '';
      }

      await createAction.mutateAsync({
        targetType,
        targetId,
        actionType: confirmationAction,
        reason: actionReason || `Report: ${report.reason}`,
        duration: confirmationAction === 'suspend' ? 24 : undefined, // 24 hours for suspension
      });

      // Mark report as resolved after taking action
      await handleUpdateStatus('resolved');

      toast({
        title: 'Action Taken',
        description: `${confirmationAction} action has been executed`,
      });

      setShowConfirmation(false);
      setConfirmationAction('');
      setActionReason('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to execute action',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="report-details-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Report Details
            </DialogTitle>
            <DialogDescription>
              Review and take action on this report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Report Info */}
            <div>
              <h3 className="font-semibold mb-2">Report Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Reporter:</span>{' '}
                  <span className="font-medium" data-testid="report-reporter">
                    {report.reporter?.username}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reason:</span>{' '}
                  <Badge variant="outline" data-testid="report-reason">
                    {report.reason}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <Badge data-testid="report-status">{report.status}</Badge>
                </div>
                <div suppressHydrationWarning>
                  <span className="text-muted-foreground">Reported:</span>{' '}
                  {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                </div>
              </div>
              {report.description && (
                <div className="mt-4">
                  <span className="text-muted-foreground text-sm">Description:</span>
                  <p className="mt-1 text-sm" data-testid="report-description">
                    {report.description}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Message Content */}
            <div>
              <h3 className="font-semibold mb-2">Reported Message</h3>
              <div className="bg-muted p-4 rounded-lg">
                <div className="mb-2 text-sm text-muted-foreground">
                  From: <span className="font-medium">{report.sender?.username}</span>
                </div>
                <p className="whitespace-pre-wrap" data-testid="message-content">
                  {report.message?.body || '[Message deleted]'}
                </p>
              </div>
            </div>

            <Separator />

            {/* Resolution Notes */}
            {report.status === 'pending' && (
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution Notes (Optional)</Label>
                <Textarea
                  id="resolution"
                  placeholder="Add notes about how you resolved this report..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                  data-testid="textarea-resolution"
                />
              </div>
            )}

            {/* Moderation Actions */}
            {report.status === 'pending' && (
              <div>
                <h3 className="font-semibold mb-4">Moderation Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => handleModeration('delete')}
                    data-testid="button-delete-message"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleModeration('hide')}
                    data-testid="button-hide-message"
                  >
                    Hide Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleModeration('warn')}
                    data-testid="button-warn-user"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Warn User
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleModeration('suspend')}
                    data-testid="button-suspend-user"
                  >
                    Suspend User (24h)
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleModeration('ban')}
                    data-testid="button-ban-user"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban User
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {report.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus('dismissed')}
                  disabled={updateStatus.isPending}
                  data-testid="button-dismiss-report"
                >
                  Dismiss Report
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('resolved')}
                  disabled={updateStatus.isPending}
                  data-testid="button-resolve-report"
                >
                  {updateStatus.isPending ? 'Updating...' : 'Mark as Resolved'}
                </Button>
              </>
            )}
            {report.status !== 'pending' && (
              <Button onClick={onClose} data-testid="button-close-report">
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Destructive Actions */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Moderation Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to <strong>{confirmationAction}</strong> this content/user?
              This action may be irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="action-reason">Reason (Optional)</Label>
            <Textarea
              id="action-reason"
              placeholder="Explain why you're taking this action..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmModeration}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
