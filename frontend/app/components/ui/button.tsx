import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";


const buttonVariants = cva(
  // base
  "inline-flex items-center justify-center gap-2 select-none rounded-lg font-medium transition duration-150 ease-in-out " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.98] shadow-sm hover:shadow-md focus-visible:ring-sky-500",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] shadow-sm hover:shadow-md focus-visible:ring-red-500",
        outline:
          "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm focus-visible:ring-slate-400",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-400",
        ghost:
          "bg-transparent text-slate-700 hover:bg-slate-100",
        link:
          "bg-transparent text-sky-600 underline-offset-4 hover:underline hover:text-sky-700 px-0 py-0",
        submit:
          "bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] shadow-md hover:shadow-lg focus-visible:ring-green-500",
      },
      size: {
        default: "h-11 px-5 py-2 rounded-lg text-sm",
        sm: "h-9 px-3 rounded-md text-sm",
        lg: "h-12 px-6 rounded-xl text-base",
        icon: "h-10 w-10 p-0 rounded-md",
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
