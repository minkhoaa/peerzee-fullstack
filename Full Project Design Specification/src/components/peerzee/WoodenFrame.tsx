import { ReactNode } from 'react';

interface WoodenFrameProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  variant?: 'parchment' | 'cork';
}

export function WoodenFrame({ 
  children, 
  className = '', 
  innerClassName = '',
  variant = 'parchment'
}: WoodenFrameProps) {
  const innerBg = variant === 'cork' ? 'cork-pattern' : 'bg-parchment';
  
  return (
    <div className={`wooden-frame ${className}`}>
      <div className={`board-inner ${innerBg} ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}
