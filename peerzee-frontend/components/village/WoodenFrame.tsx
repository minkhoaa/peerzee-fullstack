"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface WoodenFrameProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "parchment" | "cork";
}

const WoodenFrame = forwardRef<HTMLDivElement, WoodenFrameProps>(
  ({ className, variant = "parchment", children, ...props }, ref) => {
    const innerVariant = variant === "cork" ? "cork-pattern" : "bg-parchment";

    return (
      <div
        ref={ref}
        className={cn(
          "wood-grain p-3 border-4 border-wood-dark rounded-sm",
          className
        )}
        style={{
          boxShadow: "8px 8px 0 #4A3B32",
        }}
        {...props}
      >
        <div
          className={cn(
            "border-4 border-[#bcaaa4] min-h-[200px] relative",
            innerVariant
          )}
          style={{
            boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Corner Screws */}
          <div className="absolute top-2 left-2 w-4 h-4 bg-gray-400 border-2 border-gray-600 rounded-full flex items-center justify-center">
            <div className="w-full h-0.5 bg-gray-600 rotate-45"></div>
          </div>
          <div className="absolute top-2 right-2 w-4 h-4 bg-gray-400 border-2 border-gray-600 rounded-full flex items-center justify-center">
            <div className="w-full h-0.5 bg-gray-600 rotate-45"></div>
          </div>
          <div className="absolute bottom-2 left-2 w-4 h-4 bg-gray-400 border-2 border-gray-600 rounded-full flex items-center justify-center">
            <div className="w-full h-0.5 bg-gray-600 rotate-45"></div>
          </div>
          <div className="absolute bottom-2 right-2 w-4 h-4 bg-gray-400 border-2 border-gray-600 rounded-full flex items-center justify-center">
            <div className="w-full h-0.5 bg-gray-600 rotate-45"></div>
          </div>
          {children}
        </div>
      </div>
    );
  }
);

WoodenFrame.displayName = "WoodenFrame";

export { WoodenFrame };
