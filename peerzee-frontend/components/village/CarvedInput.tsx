"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CarvedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  pixelLabel?: boolean;
  error?: string;
}

const CarvedInput = forwardRef<HTMLInputElement, CarvedInputProps>(
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
        <input
          ref={ref}
          className={cn(
            "carved-input w-full",
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

CarvedInput.displayName = "CarvedInput";

export { CarvedInput };
