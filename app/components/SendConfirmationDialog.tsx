"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import type { SendRecord } from "./email-form.config";

interface SendConfirmationDialogProps {
  open: boolean;
  isSubmitting: boolean;
  recipients: SendRecord[];
  selectedRecipients: Record<string, boolean>;
  onToggleRecipient: (recipient: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const SendConfirmationDialog = ({
  open,
  isSubmitting,
  recipients,
  selectedRecipients,
  onToggleRecipient,
  onConfirm,
  onClose,
}: SendConfirmationDialogProps) => {
  const handleOpenChange = (value: boolean) => {
    if (!value) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Previously sent to these recipients</DialogTitle>
          <DialogDescription>
            This email was previously sent to some recipients from this Gmail
            account. Choose which of them should be updated and proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="max-h-64 overflow-auto flex flex-col gap-1 rounded border p-1">
            {recipients.map((record) => (
              <label
                key={record.recipient}
                className="flex items-center justify-between gap-4 p-2 bg-card"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={!!selectedRecipients[record.recipient]}
                    onCheckedChange={() =>
                      onToggleRecipient(record.recipient)
                    }
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <div className="text-sm font-medium ">
                      {record.recipient}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.lastSent).toLocaleString()}
                    </div>
                  </div>
                </div>
              </label>
            ))}
            {recipients.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">
                No conflicting recipients.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="md:ml-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Proceed"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

