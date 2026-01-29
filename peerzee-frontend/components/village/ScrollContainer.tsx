"use client";

import { HTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ScrollContainerProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
}

const ScrollContainer = forwardRef<HTMLDivElement, ScrollContainerProps>(
  ({ className, title, subtitle, footer, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full max-w-sm relative", className)} {...props}>
        {/* Scroll Top Roll */}
        <div
          className="h-10 bg-[#A07048] border-4 border-wood-dark rounded-full relative z-20 flex items-center justify-center"
          style={{ boxShadow: "2px 2px 0 #4A3B32" }}
        >
          <div className="w-[90%] h-1 bg-wood-dark/20 rounded-full"></div>
        </div>

        {/* Scroll Body */}
        <div
          className="bg-parchment border-x-4 border-wood-dark mx-4 pt-8 pb-4 px-4 min-h-[400px] mt-[-20px] relative z-10 shadow-lg"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)",
            backgroundSize: "100% 24px",
          }}
        >
          {(title || subtitle) && (
            <div className="text-center border-b-4 border-wood-dark/20 pb-2 mb-4">
              {title && (
                <h3 className="font-pixel text-4xl font-bold text-wood-dark">{title}</h3>
              )}
              {subtitle && (
                <p className="text-xs text-wood-dark/60 uppercase tracking-widest mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {children}

          {footer && <div className="mt-8 text-center">{footer}</div>}
        </div>

        {/* Scroll Bottom Roll */}
        <div
          className="h-10 bg-[#A07048] border-4 border-wood-dark rounded-full relative z-20 mt-[-20px] flex items-center justify-center"
          style={{ boxShadow: "2px 2px 0 #4A3B32" }}
        >
          <div className="w-[90%] h-1 bg-wood-dark/20 rounded-full"></div>
        </div>
      </div>
    );
  }
);

ScrollContainer.displayName = "ScrollContainer";

export { ScrollContainer };
