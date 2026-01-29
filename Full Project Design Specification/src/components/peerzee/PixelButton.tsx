import { ButtonHTMLAttributes, ReactNode } from 'react';

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'wood';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

export function PixelButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  className = '',
  ...props 
}: PixelButtonProps) {
  const variantClasses = {
    primary: 'pixel-btn-primary',
    secondary: 'pixel-btn-secondary',
    success: 'pixel-btn-success',
    wood: 'bg-wood-dark text-parchment hover:bg-wood-light'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <button
      className={`pixel-btn ${variantClasses[variant]} ${sizeClasses[size]} font-pixel uppercase tracking-wide flex items-center justify-center gap-2 ${className}`}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
