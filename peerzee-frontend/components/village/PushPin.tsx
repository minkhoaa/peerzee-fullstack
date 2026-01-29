"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface PushPinProps extends HTMLAttributes<HTMLDivElement> {
  color?: "pink" | "red" | "blue" | "yellow" | "green";
  size?: "sm" | "md" | "lg";
}

const PushPin = forwardRef<HTMLDivElement, PushPinProps>(
  ({ className, color = "red", size = "md", ...props }, ref) => {
    const colorStyles = {
      pink: "bg-pixel-pink",
      red: "bg-pixel-red",
      blue: "bg-pixel-blue",
      yellow: "bg-pixel-yellow",
      green: "bg-pixel-green",
    };

    const sizeStyles = {
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-8 h-8",
    };

    const needleSize = {
      sm: "h-3",
      md: "h-4",
      lg: "h-6",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-full border-3 border-cocoa relative z-20 shadow-pixel-sm",
          colorStyles[color],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {/* Highlight */}
        <div className="absolute top-1 left-2 w-2 h-2 bg-retro-white/40 rounded-full"></div>
        {/* Needle */}
        <div
          className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 w-0.5 bg-cocoa",
            needleSize[size]
          )}
        ></div>
      </div>
    );
  }
);

PushPin.displayName = "PushPin";

export { PushPin };
