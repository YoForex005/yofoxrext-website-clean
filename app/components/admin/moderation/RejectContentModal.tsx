import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface RejectContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: { id: string; title?: string; contentType: 'thread' | 'reply' } | null;
  onConfirm: (reason: string) => void;
  isRejecting: boolean;
}

export function RejectContentModal({ open, onOpenChange, item, onConfirm, isRejecting }: RejectContentModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.length >= 10) {
      onConfirm(reason);
      setReason('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) setReason('');
    }}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Reject Content</DialogTitle>
          <DialogDescription className="text-gray-400">
            You are rejecting: <span className="font-semibold">{item?.title || `${item?.contentType} content`}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2">
          <Textarea
            placeholder="Enter rejection reason (10-1000 characters)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            minLength={10}
            maxLength={1000}
            rows={4}
            className="bg-gray-900 border-gray-700 text-white"
            data-testid="rejection-reason"
          />
          <div className="text-sm text-gray-400 text-right">
            {reason.length} / 1000 characters
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-gray-300"
            data-testid="cancel-reject"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={reason.length < 10 || isRejecting}
            data-testid="confirm-reject"
          >
            {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
