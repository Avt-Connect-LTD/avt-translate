import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "file:text-foreground placeholder:text-white/40 selection:bg-white/10 selection:text-white",
          "bg-black/30 backdrop-blur-md border-white/10 rounded-md h-10 w-full px-4 py-2 text-sm shadow-sm transition-all duration-200",
          "hover:border-white/20 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20",
          "file:inline-flex file:h-9 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
