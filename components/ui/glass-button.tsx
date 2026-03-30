import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

// biome-ignore lint/suspicious/noExplicitAny: <>
const GlassButton = React.forwardRef<HTMLButtonElement, any>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl transition-all",
          "bg-black/20 backdrop-blur-md",
          "text-slate-200 hover:text-white",
          "focus-visible:outline-none",
          "disabled:opacity-50 disabled:pointer-events-none",
          "cursor-pointer p-2",
          className,
        )}
        {...props}
      />
    );
  },
);
GlassButton.displayName = "GlassButton";

export { GlassButton };
