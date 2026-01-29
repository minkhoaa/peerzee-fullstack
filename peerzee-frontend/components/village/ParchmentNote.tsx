"use client";

import { HTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PushPin } from "./PushPin";

export interface ParchmentNoteProps extends HTMLAttributes<HTMLDivElement> {
  showPin?: boolean;
  pinColor?: "pink" | "red" | "blue" | "yellow" | "green";
  rotation?: "left" | "right" | "none";
}

const ParchmentNote = forwardRef<HTMLDivElement, ParchmentNoteProps>(
  (
    {
      className,
      showPin = true,
      pinColor = "red",
      rotation = "none",
      children,
      ...props
    },
    ref
  ) => {
    const rotationStyles = {
      left: "-rotate-2",
      right: "rotate-1",
      none: "",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-parchment max-w-md w-full p-8 border-4 border-wood-dark relative flex flex-col items-center text-center gap-6",
          rotationStyles[rotation],
          className
        )}
        style={{
          boxShadow: "4px 4px 0 #4A3B32",
        }}
        {...props}
      >
        {/* Push Pin */}
        {showPin && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
            <PushPin color={pinColor} size="lg" />
          </div>
        )}
        {children}
      </div>
    );
  }
);

ParchmentNote.displayName = "ParchmentNote";

export { ParchmentNote };
