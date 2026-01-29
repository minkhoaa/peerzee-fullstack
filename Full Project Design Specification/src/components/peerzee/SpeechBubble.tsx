import { ReactNode } from 'react';

interface SpeechBubbleProps {
  children: ReactNode;
  direction?: 'left' | 'right';
  variant?: 'light' | 'dark';
  className?: string;
}

export function SpeechBubble({ 
  children, 
  direction = 'left',
  variant = 'light',
  className = ''
}: SpeechBubbleProps) {
  const bgColor = variant === 'light' ? 'bg-parchment' : 'bg-parchment-dark';
  const bubbleClass = direction === 'left' ? 'speech-bubble-left' : 'speech-bubble-right';
  
  return (
    <div className={`speech-bubble ${bubbleClass} ${bgColor} ${className}`}>
      {children}
    </div>
  );
}
