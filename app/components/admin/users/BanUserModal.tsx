"use client";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Ban } from "lucide-react";
import { UserData } from "@/hooks/useUserManagement";
import { useBanUser } from "@/hooks/useBanUser";
import { useState, useEffect } from "react";

interface BanUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
}

export function BanUserModal({ open, onOpenChange, user }: BanUserModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const { mutate: banUser, isPending } = useBanUser();

  useEffect(() => {
    if (!open) {
      setReason("");
      setError("");
    }
  }, [open]);

  const handleBan = () => {
    if (!user) return;

    if (!reason.trim()) {
      setError("Please provide a reason for banning this user");
      return;
    }

    if (reason.length > 500) {
      setError("Reason must be 500 characters or less");
      return;
    }

    setError("");
    banUser(
      { userId: user.id, reason: reason.trim() },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="ban-user-modal" aria-describedby="ban-user-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Confirm User Ban
          </DialogTitle>
          <DialogDescription id="ban-user-description">
            You are about to ban @{user.username}. This action will prevent them from accessing the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-medium" data-testid="modal-username">{user.username}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium" data-testid="modal-email">{user.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Status:</span>
              <span className="font-medium capitalize" data-testid="modal-status">{user.status}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ban-reason">
              Reason for Ban <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ban-reason"
              placeholder="Enter reason for ban (required, 1-500 characters)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
              disabled={isPending}
              data-testid="textarea-ban-reason"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{reason.length}/500 characters</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-testid="button-cancel-ban"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleBan}
            disabled={isPending || !reason.trim()}
            data-testid="button-confirm-ban"
          >
            {isPending ? "Banning..." : "Confirm Ban"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
