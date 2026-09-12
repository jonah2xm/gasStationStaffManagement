import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  // base: 36px control, 8px radius, 2px ink focus ring offset by 2px
  "inline-flex items-center justify-center gap-[7px] whitespace-nowrap select-none rounded-md text-[13.5px] font-medium transition-colors duration-150 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        // Yellow primary: one per screen.
        default:
          "bg-primary font-semibold text-primary-foreground hover:bg-primary-hover disabled:bg-muted disabled:text-ink-500",
        destructive:
          "bg-destructive font-semibold text-destructive-foreground hover:bg-destructive-hover disabled:bg-destructive-border",
        outline:
          "border border-input bg-card text-foreground hover:border-ink-400 hover:bg-muted disabled:border-border disabled:bg-ink-50 disabled:text-ink-500",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent disabled:bg-muted disabled:text-ink-500",
        ghost:
          "text-ink-750 hover:bg-muted hover:text-foreground disabled:text-ink-450",
        link:
          "h-auto px-0 text-info underline-offset-4 hover:text-foreground hover:underline",
        // Kept for existing forms; same look as the primary action.
        submit:
          "bg-primary font-semibold text-primary-foreground hover:bg-primary-hover disabled:bg-muted disabled:text-ink-500",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-[30px] rounded-[7px] px-2.5 text-[13px]",
        lg: "h-11 px-5 text-sm",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
