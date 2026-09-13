"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "success" | "error";
  title: React.ReactNode;
  description?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** Optional second button, shown to the left of the main action. */
  secondaryLabel?: React.ReactNode;
  onSecondary?: () => void;
}

// Result dialog after a save: green check for success, red triangle for errors.
function StatusDialog({ open, onOpenChange, variant = "success", title, description, actionLabel = "OK", onAction, secondaryLabel, onSecondary }: StatusDialogProps) {
  const success = variant === "success";
  const Icon = success ? CheckCircle2 : AlertTriangle;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              success ? "bg-success-subtle" : "bg-destructive-subtle"
            )}
          >
            <Icon aria-hidden className={cn("h-[18px] w-[18px]", success ? "text-success" : "text-destructive")} />
          </span>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          {secondaryLabel && (
            <AlertDialogCancel onClick={onSecondary}>{secondaryLabel}</AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={onAction}
            className={success ? undefined : "border border-input bg-card font-medium text-foreground hover:bg-muted"}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { StatusDialog };
