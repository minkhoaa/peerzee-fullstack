import { TextareaHTMLAttributes, forwardRef } from 'react';

interface CarvedTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  pixelLabel?: boolean;
}

export const CarvedTextarea = forwardRef<HTMLTextAreaElement, CarvedTextareaProps>(
  ({ label, pixelLabel = false, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className={`${pixelLabel ? 'font-pixel text-xl' : 'font-medium'} text-text-pixel uppercase tracking-wide`}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`carved-input resize-none ${className}`}
          {...props}
        />
      </div>
    );
  }
);

CarvedTextarea.displayName = 'CarvedTextarea';
