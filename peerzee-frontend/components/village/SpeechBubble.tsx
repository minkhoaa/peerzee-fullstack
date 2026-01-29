"use client";

import { HTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SpeechBubbleProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  direction?: "left" | "right";
  variant?: "light" | "dark";
}

const SpeechBubble = forwardRef<HTMLDivElement, SpeechBubbleProps>(
  ({ children, direction = "left", variant = "light", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "speech-bubble",
          direction === "left" ? "speech-bubble-left" : "speech-bubble-right",
          variant === "light" ? "bg-[var(--parchment)]" : "bg-[var(--parchment-dark)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SpeechBubble.displayName = "SpeechBubble";

export { SpeechBubble };
