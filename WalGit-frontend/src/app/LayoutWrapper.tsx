'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useStorage } from '@/hooks/use-storage';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  // Use state to handle hydration mismatch
  const [isCollapsed] = useStorage<boolean>('sidebarCollapsed', false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch by using default state until mounted
  const actualIsCollapsed = isMounted ? isCollapsed : false;
  
  return (
    <div 
      className={cn(
        "relative w-full min-h-screen pt-[80px] overflow-x-hidden bg-[#0d1117] transition-all duration-200",
        actualIsCollapsed ? "md:pl-[80px]" : "md:pl-[250px]"
      )}
    >
      {children}
    </div>
  );
}