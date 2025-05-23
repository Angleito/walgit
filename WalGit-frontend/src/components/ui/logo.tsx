import React from 'react';
import Image from 'next/image';
import { cn } from "@/lib/utils";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'small';
}

export function Logo({ 
  variant = 'default',
  className,
  ...props 
}: LogoProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-2 font-semibold",
        variant === 'small' ? "text-lg" : "text-xl",
        className
      )} 
      {...props}
    >
      <Image
        src="/walgitv3.png"
        alt="WalGit Logo"
        width={variant === 'small' ? 20 : 24}
        height={variant === 'small' ? 20 : 24}
        className={cn(
          "rounded-full object-cover",
          variant === 'small' ? "h-5 w-5" : "h-6 w-6"
        )}
      />
      <span>WalGit</span>
    </div>
  );
} 