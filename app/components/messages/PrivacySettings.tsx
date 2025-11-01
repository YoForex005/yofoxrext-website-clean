'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Bell, Users, Download, Trash2, Info, X } from 'lucide-react';
import { 
  usePrivacySettings, 
  useUpdatePrivacySettings, 
  useBlockedUsers, 
  useUnblockUser,
  useExportMessages 
} from '@/hooks/usePrivacySettings';

export function PrivacySettings() {
  const { data: settings, isLoading } = usePrivacySettings();
  const updateSettings = useUpdatePrivacySettings();
  const { data: blockedUsers = [], isLoading: isLoadingBlocked } = useBlockedUsers();
  const unblockUser = useUnblockUser();
  const exportMessages = useExportMessages();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSettingChange = async (key: string, value: any) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleUnblock = async (userId: string, username: string) => {
    try {
      await unblockUser.mutateAsync(userId);
      toast.success(`Unblocked ${username}`);
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const handleExport = async () => {
    try {
      await exportMessages.mutateAsync();
      toast.success('Messages exported successfully');
    } catch (error) {
      toast.error('Failed to export messages');
    }
  };

  const filteredBlockedUsers = blockedUsers.filter(
    (blocked) =>
      blocked.blockedUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encryption Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Your messages are encrypted in transit using TLS/SSL</p>
              <p className="text-xs text-muted-foreground mt-1">
                End-to-end encryption coming soon • <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Message Privacy
          </CardTitle>
          <CardDescription>Control who can send you messages and what information they can see</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="whoCanMessage">Who can send you messages</Label>
            <Select
              value={settings?.whoCanMessage || 'everyone'}
              onValueChange={(value) => handleSettingChange('whoCanMessage', value)}
              disabled={updateSettings.isPending}
            >
              <SelectTrigger id="whoCanMessage" data-testid="select-who-can-message">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="followers">Followers Only</SelectItem>
                <SelectItem value="nobody">Nobody (existing conversations only)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose who can start new conversations with you
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="readReceipts">Read receipts</Label>
                <p className="text-xs text-muted-foreground">
                  Show when you've read messages
                </p>
              </div>
              <Switch
                id="readReceipts"
                checked={settings?.readReceiptsEnabled ?? true}
                onCheckedChange={(checked) => handleSettingChange('readReceiptsEnabled', checked)}
                disabled={updateSettings.isPending}
                data-testid="switch-read-receipts"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="typingIndicators">Typing indicators</Label>
                <p className="text-xs text-muted-foreground">
                  Show when you're typing
                </p>
              </div>
              <Switch
                id="typingIndicators"
                checked={settings?.typingIndicatorsEnabled ?? true}
                onCheckedChange={(checked) => handleSettingChange('typingIndicatorsEnabled', checked)}
                disabled={updateSettings.isPending}
                data-testid="switch-typing-indicators"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="onlineStatus">Online status</Label>
                <p className="text-xs text-muted-foreground">
                  Show when you're online
                </p>
              </div>
              <Switch
                id="onlineStatus"
                checked={settings?.onlineStatusVisible ?? true}
                onCheckedChange={(checked) => handleSettingChange('onlineStatusVisible', checked)}
                disabled={updateSettings.isPending}
                data-testid="switch-online-status"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Manage how you're notified about new messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive emails when you get new messages
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings?.emailNotificationsEnabled ?? true}
              onCheckedChange={(checked) => handleSettingChange('emailNotificationsEnabled', checked)}
              disabled={updateSettings.isPending}
              data-testid="switch-email-notifications"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifications">Push notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive browser notifications for new messages
              </p>
            </div>
            <Switch
              id="pushNotifications"
              checked={settings?.pushNotificationsEnabled ?? false}
              onCheckedChange={(checked) => handleSettingChange('pushNotificationsEnabled', checked)}
              disabled={updateSettings.isPending}
              data-testid="switch-push-notifications"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="soundNotifications">Sound notifications</Label>
              <p className="text-xs text-muted-foreground">
                Play sound for new messages
              </p>
            </div>
            <Switch
              id="soundNotifications"
              checked={settings?.soundNotificationsEnabled ?? true}
              onCheckedChange={(checked) => handleSettingChange('soundNotificationsEnabled', checked)}
              disabled={updateSettings.isPending}
              data-testid="switch-sound-notifications"
            />
          </div>
        </CardContent>
      </Card>

      {/* Blocked Users */}
      <Card>
        <CardHeader>
          <CardTitle>Blocked Users</CardTitle>
          <CardDescription>Manage users you've blocked from sending you messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {blockedUsers.length > 0 && (
            <Input
              placeholder="Search blocked users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-blocked"
            />
          )}

          {isLoadingBlocked ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No blocked users</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBlockedUsers.map((blocked) => (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`blocked-user-${blocked.blockedUser.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{blocked.blockedUser.username}</p>
                    {blocked.reason && (
                      <p className="text-xs text-muted-foreground mt-1">Reason: {blocked.reason}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(blocked.blockedUser.id, blocked.blockedUser.username)}
                    disabled={unblockUser.isPending}
                    data-testid={`button-unblock-${blocked.blockedUser.id}`}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>Manage your message data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Download your message data</Label>
              <p className="text-xs text-muted-foreground">
                Export all your messages as JSON
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exportMessages.isPending}
              data-testid="button-export-messages"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Separator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-destructive">Delete all messages</Label>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete all your messages (coming soon)
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  disabled
                  data-testid="button-delete-messages"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your messages and conversations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete All Messages
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
