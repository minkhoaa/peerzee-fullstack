import { InputHTMLAttributes, forwardRef } from 'react';

interface CarvedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  pixelLabel?: boolean;
}

export const CarvedInput = forwardRef<HTMLInputElement, CarvedInputProps>(
  ({ label, pixelLabel = false, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className={`${pixelLabel ? 'font-pixel text-xl' : 'font-medium'} text-text-pixel uppercase tracking-wide`}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`carved-input ${className}`}
          {...props}
        />
      </div>
    );
  }
);

CarvedInput.displayName = 'CarvedInput';
