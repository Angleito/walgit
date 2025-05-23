'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBatteryAware } from '@/hooks/use-battery-aware';
import { cn } from '@/lib/utils';
import { 
  Home, Folder, Zap, User, type LucideIcon
} from 'lucide-react';

interface TabItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

interface MobileCyberpunkTabBarProps {
  className?: string;
  showLabels?: boolean;
  items?: Array<{
    href: string;
    label: string;
    icon: LucideIcon;
  }>;
}

/**
 * TabItem - Individual tab in the mobile tab bar
 * Features adaptive animations and haptic feedback
 */
function TabItem({ href, label, icon: Icon, isActive }: TabItemProps) {
  const { optimizationLevel, getOptimizedValue } = useBatteryAware();
  const [isPressed, setIsPressed] = useState(false);
  
  // Handle press interaction with haptic feedback
  const handlePress = () => {
    setIsPressed(true);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(isActive ? 0 : 8);
    }
    
    // Reset state
    setTimeout(() => setIsPressed(false), 300);
  };
  
  // Get effect strength based on optimization level
  const glowOpacity = getOptimizedValue('0.7', '0.5', '0.3');
  const glowColor = isActive ? '#ff2a6d' : '#05d9e8';
  
  // Only apply glow effects if not in high optimization mode
  const showGlowEffects = optimizationLevel < 2;
  
  return (
    <Link 
      href={href}
      className={cn(
        'flex flex-1 flex-col items-center justify-center relative py-2 transition-colors',
        'touch-manipulation rounded-sm mx-0.5',
        isPressed ? 'scale-95' : 'scale-100',
        isActive ? 'text-[#ff2a6d]' : 'text-[#05d9e8]/80'
      )}
      onClick={handlePress}
      onTouchStart={handlePress}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Background glow - only show if not optimizing */}
      {showGlowEffects && isActive && (
        <div 
          className="absolute inset-x-2 top-0 h-1 rounded-b-full bg-[#ff2a6d]/60"
          style={{
            boxShadow: `0 0 8px 2px rgba(255, 42, 109, ${glowOpacity})`
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Icon with glow effect */}
      <div 
        className={cn(
          'relative flex items-center justify-center w-6 h-6 mb-1',
          isActive && 'text-[#ff2a6d]'
        )}
        style={showGlowEffects && isActive ? {
          filter: `drop-shadow(0 0 3px rgba(255, 42, 109, ${glowOpacity}))`
        } : undefined}
      >
        <Icon 
          size={22} 
          className={cn(
            isActive ? 'stroke-[#ff2a6d]' : 'stroke-[#05d9e8]/80',
            'transition-colors duration-200'
          )} 
        />
      </div>
      
      {/* Label with optional glow */}
      <span 
        className={cn(
          'text-xs font-medium',
          isActive ? 'text-[#ff2a6d]' : 'text-[#05d9e8]/80'
        )}
        style={showGlowEffects && isActive ? {
          textShadow: `0 0 4px rgba(255, 42, 109, ${glowOpacity})`
        } : undefined}
      >
        {label}
      </span>
    </Link>
  );
}

/**
 * MobileCyberpunkTabBar - Battery-optimized bottom navigation bar for mobile devices
 * Features:
 * - Adaptive animations based on battery status
 * - Touch-friendly with haptic feedback
 * - Cyberpunk visual style optimized for mobile
 * - Transparent backdrop with blur effect
 */
export function MobileCyberpunkTabBar({
  className,
  showLabels = true,
  items
}: MobileCyberpunkTabBarProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { optimizationLevel } = useBatteryAware();
  
  // Default navigation items if none provided
  const defaultItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/repositories', label: 'Repos', icon: Folder },
    { href: '/explore', label: 'Explore', icon: Zap },
    { href: '/profile', label: 'Profile', icon: User },
  ];
  
  const navItems = items || defaultItems;
  
  // Only render on mobile devices
  if (!isMobile) return null;
  
  // Apply appropriate backdrop blur based on optimization level
  const blurStrength = optimizationLevel > 1 ? 'backdrop-blur-[2px]' : 'backdrop-blur-md';
  
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 h-16 md:hidden',
        'bg-black/80 border-t border-[#05d9e8]/30',
        blurStrength,
        'flex items-center justify-around px-2',
        'shadow-[0_-4px_10px_rgba(0,0,0,0.5)]',
        className
      )}
    >
      {navItems.map((item) => (
        <TabItem
          key={item.href}
          href={item.href}
          label={showLabels ? item.label : ''}
          icon={item.icon}
          isActive={pathname === item.href}
        />
      ))}
    </div>
  );
}

/**
 * Use this component to automatically add space at the bottom
 * of the page to accommodate the tab bar
 */
export function MobileTabBarSpacer() {
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;
  
  return <div className="h-16 md:h-0" aria-hidden="true" />;
}