import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, FileText, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ModerationItem {
  id: string;
  title?: string;
  body: string;
  snippet: string;
  authorName: string;
  contentType: 'thread' | 'reply';
  status: string;
  createdAt: string;
}

interface ModerationQueueTableProps {
  items: ModerationItem[];
  isLoading: boolean;
  onApprove: (id: string, type: 'thread' | 'reply') => void;
  onReject: (item: ModerationItem) => void;
}

export function ModerationQueueTable({ items, isLoading, onApprove, onReject }: ModerationQueueTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48" data-testid="queue-loading">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-48" data-testid="queue-empty">
        <p className="text-gray-500">No pending items in queue</p>
      </div>
    );
  }

  return (
    <Table data-testid="moderation-queue-table">
      <TableHeader>
        <TableRow className="border-gray-700">
          <TableHead className="text-gray-300">Content</TableHead>
          <TableHead className="text-gray-300">Type</TableHead>
          <TableHead className="text-gray-300">Author</TableHead>
          <TableHead className="text-gray-300">Created</TableHead>
          <TableHead className="text-gray-300">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className="border-gray-700" data-testid={`queue-item-${item.id}`}>
            <TableCell className="max-w-md">
              <div className="flex items-start gap-2">
                {item.contentType === 'thread' ? (
                  <FileText className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                )}
                <div>
                  {item.title && (
                    <div className="font-medium text-white mb-1">{item.title}</div>
                  )}
                  <div className="text-sm text-gray-400 line-clamp-2">
                    {item.snippet}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {item.contentType}
              </Badge>
            </TableCell>
            <TableCell className="text-gray-300">{item.authorName}</TableCell>
            <TableCell className="text-gray-400 text-sm">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onApprove(item.id, item.contentType)}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid={`approve-${item.id}`}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject(item)}
                  data-testid={`reject-${item.id}`}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
