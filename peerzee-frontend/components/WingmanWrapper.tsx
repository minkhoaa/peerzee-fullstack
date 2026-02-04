'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// Dynamic import to avoid SSR issues
const WingmanChat = dynamic(() => import('./wingman/WingmanChat'), { 
  ssr: false 
});

/**
 * Global chatbot wrapper - shows Wingman AI on all authenticated pages
 */
export default function WingmanWrapper() {
  const pathname = usePathname();
  
  // Don't show on login/register pages
  const hideOnPaths = ['/login', '/register'];
  if (hideOnPaths.includes(pathname)) {
    return null;
  }

  return <WingmanChat />;
}
