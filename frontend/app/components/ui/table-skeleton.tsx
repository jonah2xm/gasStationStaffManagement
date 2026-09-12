import * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

// Table-shaped loading placeholder for list pages: header strip, then rows
// with a name + matricule cell, text cells and a trailing badge.
function TableSkeleton({ rows = 5, columns = 5, className }: TableSkeletonProps) {
  return (
    <div role="status" aria-label="Chargement" className={cn("w-full", className)}>
      <div className="flex h-10 items-center gap-6 border-b border-border bg-ink-50 px-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-2 w-16 animate-none bg-ink-250 bg-none" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex h-[52px] items-center gap-6 border-b border-ink-150 px-4 last:border-0">
          <div className="flex w-48 shrink-0 flex-col gap-1.5">
            <Skeleton className="h-2.5 w-3/4" />
            <Skeleton className="h-2 w-1/3 animate-none bg-muted bg-none" />
          </div>
          {Array.from({ length: Math.max(columns - 1, 1) }).map((_, column) => (
            <Skeleton
              key={column}
              className={cn("h-2.5 flex-1", column === columns - 2 && "h-5 max-w-[80px] rounded-sm")}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

export { TableSkeleton };
