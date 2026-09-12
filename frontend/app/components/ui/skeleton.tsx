import * as React from "react";

import { cn } from "@/lib/utils";

// Loading placeholder: shape it like the final layout instead of showing a lone spinner.
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-[5px] bg-[linear-gradient(90deg,#EDEFF3_25%,#F6F7F9_50%,#EDEFF3_75%)] bg-[length:320px_100%]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
