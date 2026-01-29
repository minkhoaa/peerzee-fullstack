import { ReactNode } from 'react';

interface SignPlankProps {
  children: ReactNode;
  className?: string;
  active?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
}

export function SignPlank({ 
  children, 
  className = '', 
  active = false,
  onClick,
  icon
}: SignPlankProps) {
  const activeClass = active ? 'bg-primary-orange text-parchment' : 'bg-wood-dark text-parchment hover:bg-wood-light';
  const cursorClass = onClick ? 'cursor-pointer' : '';
  
  return (
    <div
      className={`sign-plank ${activeClass} ${cursorClass} px-6 py-3 font-pixel text-lg uppercase tracking-wide transition-colors flex items-center gap-3 ${className}`}
      onClick={onClick}
    >
      {icon && <span className="text-xl">{icon}</span>}
      {children}
    </div>
  );
}
