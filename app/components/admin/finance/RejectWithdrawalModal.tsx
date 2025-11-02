"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

export function RejectWithdrawalModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: RejectWithdrawalModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (reason.length < 10) {
      setError("Reason must be at least 10 characters");
      return;
    }
    if (reason.length > 500) {
      setError("Reason must be less than 500 characters");
      return;
    }
    setError("");
    onConfirm(reason);
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white" data-testid="modal-reject-withdrawal">
        <DialogHeader>
          <DialogTitle className="text-white">Reject Withdrawal Request</DialogTitle>
          <DialogDescription className="text-gray-400">
            Please provide a reason for rejecting this withdrawal request. This will be visible to the user.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason" className="text-gray-300">
              Rejection Reason
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for rejection (10-500 characters)..."
              className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
              data-testid="textarea-rejection-reason"
            />
            <div className="flex justify-between text-xs">
              <span className={`${error ? 'text-red-400' : 'text-gray-400'}`}>
                {error || `${reason.length}/500 characters`}
              </span>
              {!error && reason.length < 10 && (
                <span className="text-amber-400">Minimum 10 characters required</span>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            data-testid="button-cancel-reject"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || reason.length < 10 || reason.length > 500}
            data-testid="button-confirm-reject"
          >
            {isPending ? "Rejecting..." : "Reject Withdrawal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
