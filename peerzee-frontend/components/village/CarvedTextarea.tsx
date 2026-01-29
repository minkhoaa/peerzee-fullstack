"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CarvedTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  pixelLabel?: boolean;
  error?: string;
}

const CarvedTextarea = forwardRef<HTMLTextAreaElement, CarvedTextareaProps>(
  ({ className, label, pixelLabel, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label 
            className={cn(
              "text-sm text-[var(--text-pixel)] tracking-wide",
              pixelLabel ? "font-pixel" : "font-mono uppercase"
            )}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "carved-input w-full min-h-[100px] resize-none",
            error && "border-[var(--primary-red)]",
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-[var(--primary-red)] font-mono">{error}</span>
        )}
      </div>
    );
  }
);

CarvedTextarea.displayName = "CarvedTextarea";

export { CarvedTextarea };
