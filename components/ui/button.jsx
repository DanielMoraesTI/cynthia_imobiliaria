"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4A2E23] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#4A2E23] text-[#FBF3EC] hover:bg-[#3A2018]",
        outline: "border border-[#E8D8C8] bg-white text-[#4A2E23] hover:bg-[#FBF3EC]",
        ghost: "text-[#6B584C] hover:bg-[#F3E4D4]",
        destructive: "text-[#C2564A] hover:bg-[#F6E4E0]",
      },
      size: {
        default: "h-9 px-3 py-2",
        sm: "h-7 px-2 py-1 text-[12px]",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
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
