"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MarketplaceItem } from "@/hooks/useMarketplaceItems";

interface RejectItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MarketplaceItem | null;
  onConfirm: (reason: string) => void;
  isRejecting?: boolean;
}

export function RejectItemModal({
  open,
  onOpenChange,
  item,
  onConfirm,
  isRejecting = false,
}: RejectItemModalProps) {
  const [reason, setReason] = useState("");

  // Reset reason when modal opens/closes
  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  const handleReject = () => {
    if (reason.trim().length >= 1 && reason.trim().length <= 1000) {
      onConfirm(reason.trim());
    }
  };

  const isValidReason = reason.trim().length >= 1 && reason.trim().length <= 1000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="reject-item-modal">
        <DialogHeader>
          <DialogTitle>Reject Item</DialogTitle>
          <DialogDescription>
            You are about to reject "{item?.title}". Please provide a reason for rejection. This will be sent to the seller.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea 
              placeholder="Enter rejection reason (required, 1-1000 characters)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={1}
              maxLength={1000}
              rows={5}
              className="resize-none"
              data-testid="rejection-reason-input"
            />
            <p className="text-sm text-muted-foreground">
              {reason.length}/1000 characters
              {reason.length < 1 && <span className="text-destructive ml-2">Reason is required</span>}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            disabled={isRejecting}
            data-testid="reject-modal-cancel"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={!isValidReason || isRejecting}
            data-testid="reject-modal-confirm"
          >
            {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
