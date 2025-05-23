'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, ChevronRight, Zap, User, FileCode, Folder,
  Home, Settings, Share2, BookOpen, LifeBuoy, Shield
} from 'lucide-react';
import { MobileCyberpunkButton } from '@/components/ui/mobile-cyberpunk-button';
import { MobileCyberpunkCard } from '@/components/ui/mobile-cyberpunk-card';
import { MobileCyberpunkTheme } from '@/components/ui/mobile-cyberpunk-theme';
// import { ConnectButton, useWalletKit } from '@mysten/dapp-kit';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBatteryAware } from '@/hooks/use-battery-aware';
import { ariaAttributes } from '@/lib/accessibility';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  description?: string;
  badge?: 'new' | 'beta' | 'updated';
}

/**
 * Enhanced MobileCyberpunkNavigation - Performance-optimized cyberpunk navigation for mobile devices
 * Features:
 * - Adaptive animations based on battery and device capabilities
 * - Improved touch feedback with haptic responses
 * - Advanced navigation features with grouping and badges
 * - Intelligent loading with delayed animations
 * - Smart layout optimizations for better readability
 */
export function MobileCyberpunkNavigation() {
  const pathname = usePathname();
  const isConnected = false; // Mock for now
  const isMobile = useIsMobile();
  const {
    optimizationLevel,
    isLowBattery,
    getOptimizedValue
  } = useBatteryAware();

  const [isOpen, setIsOpen] = useState(false);
  const [isAnimationLoaded, setIsAnimationLoaded] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [ripples, setRipples] = useState<Array<{x: number, y: number, id: number, target: string}>>([]);
  const rippleIdRef = useRef(0);

  // Determine if we should use optimized animations
  const shouldReduceMotion = optimizationLevel > 1;
  const useRippleEffects = optimizationLevel < 2;

  // Load animations with a slight delay to improve initial page load performance
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsAnimationLoaded(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnimationLoaded(false);
    }
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close menu when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Navigation items with optimized mobile icons and grouping
  const primaryNavItems: NavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/repositories', label: 'Repositories', icon: Folder },
    { href: '/explore', label: 'Explore', icon: Zap, badge: 'new' },
    { href: '/demo', label: 'Demo', icon: FileCode },
  ];

  const secondaryNavItems: NavItem[] = [
    { href: '/docs', label: 'Documentation', icon: BookOpen },
    { href: '/support', label: 'Support', icon: LifeBuoy },
    { href: '/security', label: 'Security', icon: Shield, badge: 'updated' },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  // Handle item interaction with enhanced haptic feedback
  const handleItemInteraction = (index: number, element: Element | null, isSecondary = false) => {
    setActiveItem(isSecondary ? index + 100 : index); // Use offset for secondary items

    // Adaptive haptic feedback based on item type
    if (navigator.vibrate) {
      navigator.vibrate(pathname === (isSecondary ? secondaryNavItems[index].href : primaryNavItems[index].href) ? 15 : 8);
    }

    // Generate ripple effect at touch point
    if (useRippleEffects && element) {
      const rect = element.getBoundingClientRect();
      // Center of element for consistent effect
      const x = rect.width / 2;
      const y = rect.height / 2;

      const newRipple = {
        x,
        y,
        id: rippleIdRef.current++,
        target: isSecondary ? `secondary-${index}` : `primary-${index}`
      };

      setRipples(prev => [...prev, newRipple]);

      // Clean up ripple after animation completes
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    // Reset active state after animation completes
    setTimeout(() => setActiveItem(null), 300);
  };

  // Toggle menu with enhanced haptic feedback
  const toggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);

    // Adaptive haptic feedback based on action
    if (navigator.vibrate) {
      // Different pattern for open vs close
      if (newState) {
        navigator.vibrate([10, 30, 10]); // "Open" pattern
      } else {
        navigator.vibrate(15); // Simple "close" feedback
      }
    }
  };

  // Get the transition duration based on optimization level
  const getTransitionDuration = () => {
    return getOptimizedValue('300ms', '200ms', '150ms');
  };

  // Get appropriate backdrop blur based on device capability
  const getBackdropBlur = () => {
    return shouldReduceMotion ? 'backdrop-blur-[2px]' : 'backdrop-blur-sm';
  };

  // Only render for mobile devices
  if (!isMobile) return null;

  return (
    <div className="md:hidden">
      {/* Toggle Button - Enhanced for touch with battery-aware effects */}
      <MobileCyberpunkButton
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full"
        size="icon"
        glowColor={isOpen ? "pink" : "blue"}
        intensity={isLowBattery ? "low" : "auto"}
        importance="primary"
        rippleEffect={false}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </MobileCyberpunkButton>

      {/* Navigation Menu - Battery-aware animations */}
      <div
        ref={navRef}
        id="mobile-nav-menu"
        className={`fixed inset-0 z-40 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-${getTransitionDuration()} ease-in-out`}
        aria-hidden={!isOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Backdrop - Optimized blur for performance */}
        <div
          className={`absolute inset-0 bg-black/70 ${getBackdropBlur()}`}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />

        {/* Menu content - Enhanced for mobile with battery optimizations */}
        <div
          className={`absolute right-0 top-0 h-full w-[85%] max-w-[320px] bg-black/90 border-l border-[#05d9e8]/40
                     shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden
                     transform transition-transform duration-${getTransitionDuration()} ease-out
                     ${isOpen && isAnimationLoaded ? 'translate-x-0' : 'translate-x-[10px]'}`}
        >
          {/* Header with logo and theme controls */}
          <MobileCyberpunkCard
            className="rounded-none border-0 border-b border-[#ff2a6d]/40 p-4"
            accentColor="mixed"
            isInteractive={false}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-[#05d9e8] to-[#ff2a6d] p-0.5 rounded-md mr-2">
                  <div className="bg-black p-1 rounded-[3px]">
                    <Zap className="w-4 h-4 text-[#05d9e8]" />
                  </div>
                </div>
                <h2 className="text-white font-bold tracking-wider text-lg">WALGIT</h2>
              </div>
              <MobileCyberpunkTheme />
            </div>
          </MobileCyberpunkCard>

          {/* Main navigation area with scrolling */}
          <nav className="flex-1 overflow-y-auto p-3 pb-20">
            {/* Primary navigation items */}
            <div className="mb-6">
              <div className="px-1 mb-2">
                <h3 className="text-[#05d9e8] text-xs font-medium uppercase tracking-wider">
                  Main Navigation
                </h3>
              </div>

              <ul className="space-y-1">
                {primaryNavItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const isHighlighted = activeItem === index;

                  return (
                    <li key={item.href} id={`primary-${index}`} className="relative">
                      <Link
                        href={item.href}
                        className={`
                          flex items-center px-4 py-3 rounded-sm relative overflow-hidden touch-manipulation
                          transition-all duration-200 min-h-[48px]
                          ${isActive ? 'text-white bg-[#05d9e8]/10' : 'text-[#05d9e8]/80'}
                          ${isHighlighted ? 'bg-[#05d9e8]/15' : ''}
                          active:bg-[#05d9e8]/20
                        `}
                        onClick={(e) => handleItemInteraction(index, e.currentTarget)}
                        onTouchStart={(e) => handleItemInteraction(index, e.currentTarget)}
                        {...ariaAttributes.current(isActive)}
                      >
                        {/* Ripple effects */}
                        {ripples.filter(r => r.target === `primary-${index}`).map(ripple => (
                          <span
                            key={ripple.id}
                            style={{
                              position: 'absolute',
                              top: ripple.y,
                              left: ripple.x,
                              transform: 'translate(-50%, -50%)',
                              backgroundColor: '#05d9e8',
                              borderRadius: '50%',
                              opacity: 0,
                              width: '120px',
                              height: '120px',
                              animation: 'cyberpunk-ripple 600ms ease-out forwards'
                            }}
                            aria-hidden="true"
                          />
                        ))}

                        {/* Left accent for active item - Improved visibility */}
                        {isActive && (
                          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#05d9e8] to-[#ff2a6d]" />
                        )}

                        {/* Icon with optimized animations */}
                        <div className={`
                          flex items-center justify-center w-8 h-8 mr-3 rounded-md
                          ${isActive ? 'bg-[#05d9e8]/10' : 'bg-transparent'}
                          transition-colors duration-200
                        `}>
                          <Icon className={`h-5 w-5 ${isActive ? 'text-[#ff2a6d]' : 'text-[#05d9e8]/80'}`} />
                        </div>

                        {/* Label with better typography for mobile */}
                        <div className="flex flex-col">
                          <span className={`${isActive ? 'font-medium' : ''} text-base`}>
                            {item.label}
                          </span>
                          {item.description && (
                            <span className="text-xs text-white/60">{item.description}</span>
                          )}
                        </div>

                        {/* Badge for new/updated items */}
                        {item.badge && (
                          <span className={`
                            ml-auto px-1.5 py-0.5 text-[10px] uppercase font-bold rounded
                            ${item.badge === 'new' ? 'bg-[#ff2a6d]/20 text-[#ff2a6d]' : ''}
                            ${item.badge === 'beta' ? 'bg-[#d16aff]/20 text-[#d16aff]' : ''}
                            ${item.badge === 'updated' ? 'bg-[#00ff9f]/20 text-[#00ff9f]' : ''}
                          `}>
                            {item.badge}
                          </span>
                        )}

                        {/* Chevron for active item */}
                        {isActive && !item.badge && (
                          <ChevronRight className="ml-auto h-4 w-4 text-[#ff2a6d]/80" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Secondary navigation items */}
            <div className="mb-4">
              <div className="px-1 mb-2">
                <h3 className="text-[#ff2a6d] text-xs font-medium uppercase tracking-wider">
                  Resources
                </h3>
              </div>

              <ul className="space-y-1">
                {secondaryNavItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const isHighlighted = activeItem === index + 100; // Offset for secondary

                  return (
                    <li key={item.href} id={`secondary-${index}`} className="relative">
                      <Link
                        href={item.href}
                        className={`
                          flex items-center px-4 py-2.5 rounded-sm relative overflow-hidden touch-manipulation
                          transition-all duration-200
                          ${isActive ? 'text-white bg-[#ff2a6d]/10' : 'text-white/70'}
                          ${isHighlighted ? 'bg-[#ff2a6d]/15' : ''}
                          active:bg-[#ff2a6d]/20
                        `}
                        onClick={(e) => handleItemInteraction(index, e.currentTarget, true)}
                        onTouchStart={(e) => handleItemInteraction(index, e.currentTarget, true)}
                        {...ariaAttributes.current(isActive)}
                      >
                        {/* Ripple effects */}
                        {ripples.filter(r => r.target === `secondary-${index}`).map(ripple => (
                          <span
                            key={ripple.id}
                            style={{
                              position: 'absolute',
                              top: ripple.y,
                              left: ripple.x,
                              transform: 'translate(-50%, -50%)',
                              backgroundColor: '#ff2a6d',
                              borderRadius: '50%',
                              opacity: 0,
                              width: '120px',
                              height: '120px',
                              animation: 'cyberpunk-ripple 600ms ease-out forwards'
                            }}
                            aria-hidden="true"
                          />
                        ))}

                        {/* Left accent for active item */}
                        {isActive && (
                          <div className="absolute left-0 top-0 h-full w-1 bg-[#ff2a6d]" />
                        )}

                        {/* Icon */}
                        <Icon className={`h-4 w-4 mr-3 ${isActive ? 'text-[#ff2a6d]' : 'text-white/70'}`} />

                        {/* Label */}
                        <span className={`${isActive ? 'font-medium' : ''} text-sm`}>
                          {item.label}
                        </span>

                        {/* Badge for new/updated items */}
                        {item.badge && (
                          <span className={`
                            ml-auto px-1.5 py-0.5 text-[10px] uppercase font-bold rounded
                            ${item.badge === 'new' ? 'bg-[#ff2a6d]/20 text-[#ff2a6d]' : ''}
                            ${item.badge === 'beta' ? 'bg-[#d16aff]/20 text-[#d16aff]' : ''}
                            ${item.badge === 'updated' ? 'bg-[#00ff9f]/20 text-[#00ff9f]' : ''}
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Create repository button - With improved visibility and positioning */}
            {isConnected && (
              <div className="mt-6 px-2">
                <MobileCyberpunkButton
                  className="w-full justify-center py-3"
                  glowColor="mixed"
                  intensity="auto"
                  importance="primary"
                  highContrast={true}
                  onClick={(e) => handleItemInteraction(-1, e.currentTarget as Element)}
                >
                  <FileCode className="h-4 w-4 mr-2" />
                  Create Repository
                </MobileCyberpunkButton>
              </div>
            )}

            {/* Share button for easier collaboration */}
            <div className="mt-4 px-2">
              <MobileCyberpunkButton
                className="w-full justify-center py-2.5"
                glowColor="green"
                intensity="auto"
                importance="secondary"
                variant="outline"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share WalGit
              </MobileCyberpunkButton>
            </div>
          </nav>

          {/* Footer with fixed positioning for better access */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#ff2a6d]/40 flex flex-col gap-3 bg-black/80 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#05d9e8] font-medium">WALLET</span>
              <MobileCyberpunkButton
                size="sm"
                glowColor="blue"
                intensity="auto"
                className="py-1 px-3 text-sm h-auto"
              >
                Connect
              </MobileCyberpunkButton>
            </div>

            <MobileCyberpunkButton
              className="w-full justify-center py-2.5 mt-1"
              glowColor="pink"
              intensity="auto"
              importance="primary"
              onClick={() => setIsOpen(false)}
              highContrast={true}
            >
              Close Menu
            </MobileCyberpunkButton>
          </div>
        </div>
      </div>

      {/* Animations for ripple effects */}
      <style jsx global>{`
        @keyframes cyberpunk-ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 0.5;
          }
          100% {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}