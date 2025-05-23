'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
}

interface CyberpunkNavBarProps {
  className?: string;
  logoComponent: React.ReactNode;
  navItems: NavItem[];
  rightActions?: React.ReactNode;
}

export default function CyberpunkNavBar({
  className,
  logoComponent,
  navItems,
  rightActions,
}: CyberpunkNavBarProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [randomOffsets, setRandomOffsets] = useState<number[]>([]);

  // Generate random offsets for glitch effect
  useEffect(() => {
    setRandomOffsets(navItems.map(() => Math.random() * 10 - 5));
  }, [navItems]);

  // Trigger glitch effect
  const triggerGlitch = (index: number) => {
    setActiveIndex(index);
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 800);
  };

  return (
    <div className={cn(
      "relative z-10 border-b border-[#ff2a6d]/30 bg-black/80 backdrop-blur-lg",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#05d9e8]/5 before:via-transparent before:to-[#ff2a6d]/5",
      "after:absolute after:bottom-0 after:h-[1px] after:w-full after:bg-gradient-to-r after:from-[#05d9e8] after:via-[#ff2a6d]/50 after:to-[#05d9e8]",
      className
    )}>
      {/* Git-like centered layout with narrower width */}
      <div className="w-full flex items-center justify-between px-6 py-6">
        {/* Logo with clip-path angle */}
        <div className="relative overflow-hidden">
          <div className="relative z-10 clip-path-logo bg-gradient-to-r from-[#05d9e8]/10 to-[#ff2a6d]/10 p-2">
            {logoComponent}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#05d9e8] to-[#ff2a6d] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Navigation items with centered, Git-like layout */}
        <nav className="hidden md:flex items-center gap-6 justify-center flex-1 mx-8">
          {navItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <Button
                variant="cyberGlitch"
                size="lg"
                className={cn(
                  "relative font-orbitron text-base px-8 py-3 min-w-[150px]",
                  activeIndex === index && "animate-glitch-effect"
                )}
                onMouseEnter={() => triggerGlitch(index)}
                onFocus={() => triggerGlitch(index)}
              >
                {/* Glitch layers overlay */}
                {isGlitching && activeIndex === index && (
                  <>
                    <span
                      className="absolute inset-0 text-[#ff2a6d] opacity-70 z-20"
                      style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 55%)',
                        transform: `translate(${randomOffsets[index]}px, 0)`,
                        transition: 'transform 100ms ease-in-out'
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="absolute inset-0 text-[#05d9e8] opacity-70 z-20"
                      style={{
                        clipPath: 'polygon(0 60%, 100% 50%, 100% 100%, 0 100%)',
                        transform: `translate(${-randomOffsets[index]}px, 0)`,
                        transition: 'transform 100ms ease-in-out'
                      }}
                    >
                      {item.label}
                    </span>
                  </>
                )}
                
                {/* Main button text */}
                <span className="relative z-10">{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right side actions (buttons, etc) - more compact and Git-like */}
        <div className="flex items-center gap-2">
          {rightActions || (
            <>
              {/* Default sign in/sign up buttons if no custom actions provided */}
              <Button
                size="sm"
                className="relative overflow-hidden group bg-transparent border border-[#05d9e8]/50 text-[#05d9e8] hover:border-[#05d9e8] hover:text-white hover:shadow-[0_0_15px_rgba(5,217,232,0.5)] focus:shadow-[0_0_20px_rgba(5,217,232,0.7)] transition-all duration-300"
              >
                <span className="relative z-10">Sign in</span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#05d9e8] to-[#05d9e8]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform origin-left"></span>
              </Button>
              <Button
                size="sm"
                className="relative overflow-hidden group bg-transparent border border-[#ff2a6d]/50 text-[#ff2a6d] hover:border-[#ff2a6d] hover:text-white hover:shadow-[0_0_15px_rgba(255,42,109,0.5)] focus:shadow-[0_0_20px_rgba(255,42,109,0.7)] transition-all duration-300"
              >
                <span className="relative z-10">Sign up</span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#ff2a6d]/70 to-[#ff2a6d] opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform origin-left"></span>
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile menu button (for responsive design) */}
      <div className="md:hidden absolute right-4 top-4">
        <Button
          className="relative overflow-hidden group bg-transparent border border-[#05d9e8]/50 text-[#05d9e8] hover:border-[#05d9e8] hover:text-white hover:shadow-[0_0_15px_rgba(5,217,232,0.5)] focus:shadow-[0_0_20px_rgba(5,217,232,0.7)] transition-all duration-300"
        >
          <span className="relative z-10">Menu</span>
          <span className="absolute inset-0 bg-gradient-to-r from-[#05d9e8] to-[#05d9e8]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform origin-left"></span>
        </Button>
      </div>
      
      {/* Add CSS for clip-path effects */}
      <style jsx global>{`
        .clip-path-logo {
          clip-path: polygon(0 0, 100% 0, 95% 100%, 0 100%);
        }
        
        @keyframes glitch {
          0% {
            transform: translate(0);
          }
          20% {
            transform: translate(-5px, 5px);
          }
          40% {
            transform: translate(-5px, -5px);
          }
          60% {
            transform: translate(5px, 5px);
          }
          80% {
            transform: translate(5px, -5px);
          }
          100% {
            transform: translate(0);
          }
        }
        
        .animate-glitch {
          animation: glitch 500ms ease-in-out;
        }
      `}</style>
    </div>
  );
}