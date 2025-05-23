'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
// import { ConnectButton, useWalletKit } from '@mysten/dapp-kit';
import ThemeSwitcher from '@/components/ui/theme-switcher';
import { ariaAttributes, useFocusTrap } from '@/lib/accessibility';

export function MobileNavigation() {
  const pathname = usePathname();
  const isConnected = false; // mock
  const [open, setOpen] = useState(false);
  const drawerContentRef = useRef<HTMLDivElement>(null);
  const [glitchItem, setGlitchItem] = useState<number | null>(null);

  // Enable focus trapping when the drawer is open
  useFocusTrap(drawerContentRef, open);

  const navItems = [
    { href: '/', label: 'Home', accessKey: 'h' },
    { href: '/repositories', label: 'Repositories', accessKey: 'r' },
    { href: '/explore', label: 'Explore', accessKey: 'e' },
    { href: '/docs', label: 'Documentation', accessKey: 'd' },
  ];

  // Handle escape key to close the drawer
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [open]);

  // Glitch effect handler
  const triggerGlitch = (index: number) => {
    setGlitchItem(index);
    setTimeout(() => setGlitchItem(null), 800);
  };

  return (
    <div className="md:hidden">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger>
          <Button
            className="relative overflow-hidden group bg-transparent border border-[#05d9e8]/50 text-[#05d9e8] hover:border-[#05d9e8] hover:text-white hover:shadow-[0_0_15px_rgba(5,217,232,0.5)] focus:shadow-[0_0_20px_rgba(5,217,232,0.7)] transition-all duration-300"
            size="icon"
            aria-label="Open navigation menu"
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#05d9e8] to-[#05d9e8]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform origin-left"></span>
            <Menu className="h-5 w-5 relative z-10" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent
          id="mobile-navigation"
          className="h-[85vh] p-0 bg-black border border-[#ff2a6d]/30 shadow-[0_0_25px_rgba(5,217,232,0.3)]"
          ref={drawerContentRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#05d9e8]/5 via-transparent to-[#ff2a6d]/5 pointer-events-none" />

          <DrawerHeader className="text-left border-b border-[#ff2a6d]/30 p-4 backdrop-blur-sm bg-black/50">
            <DrawerTitle className="text-[#05d9e8] font-bold">
              <span className="relative">
                WALGIT NAVIGATION
                <span className="absolute -bottom-1 left-0 h-[1px] w-full bg-gradient-to-r from-[#05d9e8] to-[#ff2a6d]"></span>
              </span>
            </DrawerTitle>
          </DrawerHeader>

          <nav className="flex flex-col space-y-2 mt-4 p-4" aria-label="Mobile Navigation">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative px-4 py-3 text-base clip-path-nav-link transition-all duration-300"
                onClick={() => setOpen(false)}
                onMouseEnter={() => triggerGlitch(index)}
                onFocus={() => triggerGlitch(index)}
                {...ariaAttributes.current(pathname === item.href)}
                accessKey={item.accessKey}
              >
                {/* Background layers */}
                <span className="absolute inset-0 bg-gradient-to-r from-[#05d9e8]/10 to-transparent
                      group-hover:from-[#05d9e8]/20 group-hover:to-[#ff2a6d]/10 transition-all duration-300"></span>

                {/* Neon border */}
                <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-gradient-to-r from-[#05d9e8] to-[#ff2a6d] transition-all duration-300 group-hover:w-full"></span>

                {/* Glitch effect */}
                {glitchItem === index && (
                  <>
                    <span className="absolute inset-0 text-[#ff2a6d] opacity-70"
                      style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 55%)',
                        transform: `translate(${Math.random() * 10 - 5}px, 0)`,
                        transition: 'transform 100ms ease-in-out'
                      }}>
                      {item.label}
                    </span>
                    <span className="absolute inset-0 text-[#05d9e8] opacity-70"
                      style={{
                        clipPath: 'polygon(0 60%, 100% 50%, 100% 100%, 0 100%)',
                        transform: `translate(${Math.random() * 10 - 5}px, 0)`,
                        transition: 'transform 100ms ease-in-out'
                      }}>
                      {item.label}
                    </span>
                  </>
                )}

                {/* Main text */}
                <span className="relative z-10 text-white group-hover:text-[#05d9e8] transition-colors duration-300">
                  {item.label}
                </span>

                {/* Active indicator */}
                {pathname === item.href && (
                  <span className="absolute left-0 top-0 h-full w-1 bg-[#ff2a6d]" />
                )}
              </Link>
            ))}

            {isConnected && (
              <Link
                href="/new-repository"
                className="group relative px-4 py-3 text-base clip-path-nav-link bg-gradient-to-r from-[#05d9e8]/20 to-[#ff2a6d]/20 transition-all duration-300"
                onClick={() => setOpen(false)}
                accessKey="n"
                aria-label="Create a new repository"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#05d9e8]/10 to-[#ff2a6d]/10 opacity-50
                      group-hover:opacity-100 transition-all duration-300"></span>
                <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-gradient-to-r from-[#05d9e8] to-[#ff2a6d] transition-all duration-300 group-hover:w-full"></span>
                <span className="relative z-10 text-[#05d9e8] group-hover:text-white transition-colors duration-300">
                  Create Repository
                </span>
              </Link>
            )}
          </nav>

          <DrawerFooter className="mt-auto border-t border-[#ff2a6d]/30 pt-4 p-4 backdrop-blur-sm bg-black/50">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center" id="mobile-theme-control">
                <span className="text-sm font-medium text-[#05d9e8]" id="theme-label">THEME</span>
                <div aria-labelledby="theme-label">
                  <ThemeSwitcher />
                </div>
              </div>
              <div className="flex justify-between items-center" id="mobile-wallet-control">
                <span className="text-sm font-medium text-[#05d9e8]" id="wallet-label">WALLET</span>
                <div aria-labelledby="wallet-label">
                  <button className="bg-blue-500 text-white py-1 px-3 rounded text-sm">Connect</button>
                </div>
              </div>
            </div>
            <DrawerClose>
              <Button
                className="relative mt-4 w-full overflow-hidden group bg-transparent border border-[#ff2a6d]/50 text-[#ff2a6d] hover:border-[#ff2a6d] hover:text-white hover:shadow-[0_0_15px_rgba(255,42,109,0.5)] focus:shadow-[0_0_20px_rgba(255,42,109,0.7)] transition-all duration-300"
                aria-label="Close navigation menu"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#ff2a6d]/70 to-[#ff2a6d] opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform origin-left"></span>
                <span className="relative z-10">CLOSE</span>
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* CSS for clip-path effects */}
      <style jsx global>{`
        .clip-path-nav-link {
          clip-path: polygon(0 0, 100% 0, 98% 100%, 0 100%);
        }

        @keyframes glitch {
          0% {
            transform: translate(0);
            filter: hue-rotate(0deg);
          }
          20% {
            transform: translate(-2px, 2px);
            filter: hue-rotate(70deg);
          }
          40% {
            transform: translate(-2px, -2px);
            filter: hue-rotate(140deg);
          }
          60% {
            transform: translate(2px, 2px);
            filter: hue-rotate(210deg);
          }
          80% {
            transform: translate(2px, -2px);
            filter: hue-rotate(280deg);
          }
          100% {
            transform: translate(0);
            filter: hue-rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}