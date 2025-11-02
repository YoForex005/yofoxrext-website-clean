'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ModerationHeader } from '@/components/admin/moderation/ModerationHeader';
import { ContentTypeToggle } from '@/components/admin/moderation/ContentTypeToggle';
import { ModerationQueueTable } from '@/components/admin/moderation/ModerationQueueTable';
import { RejectContentModal } from '@/components/admin/moderation/RejectContentModal';
import { useModerationQueue } from '@/hooks/useModerationQueue';
import { useApproveContent } from '@/hooks/useApproveContent';
import { useRejectContent } from '@/hooks/useRejectContent';

export default function ModerationPage() {
  const { toast } = useToast();
  const [contentType, setContentType] = useState<'all' | 'threads' | 'replies'>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const { data, isLoading } = useModerationQueue(contentType);

  const { mutate: approveContent, isPending: isApproving } = useApproveContent();
  const { mutate: rejectContent, isPending: isRejecting } = useRejectContent();

  const handleApprove = (id: string, type: 'thread' | 'reply') => {
    if (confirm(`Are you sure you want to approve this ${type}?`)) {
      approveContent(
        { id, contentType: type },
        {
          onSuccess: () => {
            toast({
              title: 'Content approved',
              description: `${type} approved successfully`,
            });
          },
          onError: (error: any) => {
            toast({
              title: 'Error',
              description: error.message || 'Failed to approve content',
              variant: 'destructive',
            });
          },
        }
      );
    }
  };

  const handleRejectClick = (item: any) => {
    setSelectedItem(item);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = (reason: string) => {
    if (!selectedItem) return;

    rejectContent(
      { id: selectedItem.id, contentType: selectedItem.contentType, reason },
      {
        onSuccess: () => {
          toast({
            title: 'Content rejected',
            description: `${selectedItem.contentType} rejected successfully`,
          });
          setRejectModalOpen(false);
          setSelectedItem(null);
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to reject content',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ModerationHeader />

      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger 
            value="queue" 
            className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            data-testid="tab-queue"
          >
            Moderation Queue
          </TabsTrigger>
          <TabsTrigger 
            value="reported" 
            className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            data-testid="tab-reported"
          >
            Reported Content
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            data-testid="tab-history"
          >
            Moderation History
          </TabsTrigger>
          <TabsTrigger 
            value="stats" 
            className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            data-testid="tab-stats"
          >
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6">
          <ContentTypeToggle value={contentType} onChange={setContentType} />

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                Pending Content (<span data-testid="pending-count">{data?.items?.length || 0}</span>)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ModerationQueueTable
                items={data?.items || []}
                isLoading={isLoading}
                onApprove={handleApprove}
                onReject={handleRejectClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reported">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="flex items-center justify-center h-48">
              <p className="text-gray-500">Reported Content feature coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="flex items-center justify-center h-48">
              <p className="text-gray-500">Moderation History feature coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="flex items-center justify-center h-48">
              <p className="text-gray-500">Statistics feature coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RejectContentModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        item={selectedItem}
        onConfirm={handleRejectConfirm}
        isRejecting={isRejecting}
      />
    </div>
  );
}
