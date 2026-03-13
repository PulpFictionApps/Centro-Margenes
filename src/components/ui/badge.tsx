import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "secondary" | "outline";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      {
        "border-transparent bg-primary text-primary-foreground hover:bg-primary/80":
          variant === "default",
        "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80":
          variant === "secondary",
        "text-foreground": variant === "outline",
      },
      className
    )}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge };
