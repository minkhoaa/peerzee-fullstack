"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SignPlankProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "left" | "right" | "none";
}

const SignPlank = forwardRef<HTMLDivElement, SignPlankProps>(
  ({ className, direction = "none", children, ...props }, ref) => {
    return (
      <div className={cn("relative group cursor-pointer", className)} {...props}>
        {/* Arrow tip - pointing opposite direction */}
        {direction === "left" && (
          <div className="absolute top-1/2 -right-4 w-0 h-0 border-t-[14px] border-t-transparent border-l-[16px] border-l-wood-dark border-b-[14px] border-b-transparent -translate-y-1/2"></div>
        )}
        {direction === "right" && (
          <div className="absolute top-1/2 -left-4 w-0 h-0 border-t-[14px] border-t-transparent border-r-[16px] border-r-wood-dark border-b-[14px] border-b-transparent -translate-y-1/2 z-10"></div>
        )}

        <div
          ref={ref}
          className="relative bg-[#A07048] border-4 border-wood-dark px-4 py-3 hover:scale-105 transition-transform"
          style={{
            boxShadow: "4px 4px 0 #4A3B32",
          }}
        >
          {/* Nails */}
          <div className="absolute top-1/2 left-2 w-2 h-2 bg-wood-dark rounded-full -translate-y-1/2 opacity-50"></div>
          <div className="absolute top-1/2 right-2 w-2 h-2 bg-wood-dark rounded-full -translate-y-1/2 opacity-50"></div>
          <span className="block text-center text-parchment font-pixel text-2xl uppercase tracking-wider drop-shadow-sm">
            {children}
          </span>
        </div>
      </div>
    );
  }
);

SignPlank.displayName = "SignPlank";

export { SignPlank };
