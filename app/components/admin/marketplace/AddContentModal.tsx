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

interface AddContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddContentModal({ open, onOpenChange }: AddContentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="add-content-modal">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
          <DialogDescription>
            Manually upload content on behalf of a user
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-400">Feature coming soon...</p>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-modal"
          >
            Cancel
          </Button>
          <Button disabled data-testid="button-upload-modal">
            Upload (Coming Soon)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
