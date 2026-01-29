"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "wood" | "danger";
  size?: "sm" | "md" | "lg";
}

const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles = "pixel-btn font-pixel uppercase tracking-wider transition-all duration-75";
    
    const variantStyles = {
      primary: "pixel-btn-primary",
      secondary: "pixel-btn-secondary",
      success: "pixel-btn-success",
      wood: "pixel-btn-wood",
      danger: "bg-primary-red hover:bg-primary-red/80 text-parchment border-3 border-wood-dark",
    };

    const sizeStyles = {
      sm: "text-lg px-3 py-1",
      md: "text-2xl px-4 py-2",
      lg: "text-4xl px-6 py-3",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

PixelButton.displayName = "PixelButton";

export { PixelButton };
