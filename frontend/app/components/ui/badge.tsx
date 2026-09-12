import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Generic badge. For business statuses use <StatusBadge> so each concept keeps one color.
const badgeVariants = cva(
  "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-sm border px-[9px] text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Transparent border so pages that pass their own bg/text colors don't get an ink outline.
        default: "border-transparent bg-foreground text-white",
        secondary: "border-border bg-muted text-ink-750",
        destructive: "border-destructive-border bg-destructive-subtle text-destructive-text",
        outline: "border-input bg-card text-ink-750",
        success: "border-success-border bg-success-subtle text-success-text",
        warning: "border-warning-border bg-warning-subtle text-warning-text",
        info: "border-info-border bg-info-subtle text-info-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
