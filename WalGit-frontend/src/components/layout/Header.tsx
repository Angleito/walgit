'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import CyberpunkNavBar from './CyberpunkNavBar';
import { MobileNavigation } from './MobileNavigation';
import { MobileCyberpunkNavigation } from './MobileCyberpunkNavigation';
import { Button } from '@/components/ui/button';
import {
  ResponsiveCyberpunkButton,
  useCyberpunkClasses
} from '@/components/ui/responsive-cyberpunk-ui';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBatteryAware } from '@/hooks/use-battery-aware';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { ConnectButton } from '@mysten/dapp-kit';
import { shortenAddress } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

function HeaderComponent({ className }: HeaderProps) {
  const isMobile = useIsMobile();
  const { shouldOptimizeEffects } = useBatteryAware();
  const cyberpunkClasses = useCyberpunkClasses();
  const account = useCurrentAccount();

  // Define navigation items
  // Navigation items are now in the sidebar

  // Logo component
  const logoComponent = (
    <Link href="/" className="flex items-center gap-3 group">
      <div className={`relative w-10 h-10 transition-transform duration-200 ${!shouldOptimizeEffects ? 'group-hover:scale-110' : ''}`}>
        <Image
          src="/walgitv3.png"
          alt="WalGit Logo"
          width={40}
          height={40}
          className="w-full h-full object-contain rounded-full"
          priority
        />
        {/* Glow effect on hover */}
        {!shouldOptimizeEffects && (
          <div className="absolute inset-0 bg-[#05d9e8]/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-[3px]" />
        )}
      </div>
      <h1 className="text-2xl font-bold text-white group-hover:text-[#05d9e8] transition-colors">
        WalGit
      </h1>
    </Link>
  );

  // Custom action buttons with cyberpunk styling - responsive
  const rightActions = (
    <>
      <ConnectButton className={cn(
        "font-orbitron",
        shouldOptimizeEffects ? "" : "transition-all duration-300"
      )}>
        {({ connected, connecting, connect, disconnect, wallet }) => {
          if (connected && wallet && account) {
            return (
              <div className="flex items-center gap-2">
                <Link href="/new-repository">
                  <ResponsiveCyberpunkButton
                    variant="cyberNeon"
                    size="lg"
                    showGlow={!shouldOptimizeEffects}
                    animation={shouldOptimizeEffects ? "none" : "neonBreathe"}
                    className="text-[#ff2a6d] px-6 py-2.5 text-base"
                  >
                    <span className="relative z-10">New Repository</span>
                  </ResponsiveCyberpunkButton>
                </Link>
                <ResponsiveCyberpunkButton
                  variant="cyberGlitch"
                  size="lg"
                  showGlow={!shouldOptimizeEffects}
                  animation={shouldOptimizeEffects ? "none" : "flicker"}
                  className="text-[#05d9e8] px-6 py-2.5 text-base"
                  onClick={disconnect}
                >
                  <span className="relative z-10">{shortenAddress(account.address)}</span>
                </ResponsiveCyberpunkButton>
              </div>
            );
          }
          
          return (
            <ResponsiveCyberpunkButton
              variant="cyberGlitch"
              size="lg"
              showGlow={!shouldOptimizeEffects}
              animation={shouldOptimizeEffects ? "none" : "flicker"}
              className="text-[#05d9e8] px-8 py-3 text-base"
              onClick={connect}
              disabled={connecting}
            >
              <span className="relative z-10">
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </span>
              {!shouldOptimizeEffects && (
                <span className="absolute inset-0 bg-gradient-to-r from-[#05d9e8] to-[#05d9e8]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform origin-left"></span>
              )}
            </ResponsiveCyberpunkButton>
          );
        }}
      </ConnectButton>
    </>
  );

  return (
    <header
      className={cn(
        "h-[80px] bg-[#0d1117] border-b border-[#30363d]",
        className
      )}
      role="banner"
    >
      <div className="h-full max-w-full mx-auto px-6 flex items-center justify-between">
        {/* Logo on the left */}
        {logoComponent}
        
        {/* Wallet connection on the right */}
        <div className="flex items-center gap-4">
          {rightActions}
        </div>
      </div>

      {/* Battery-aware global styles for animations */}
      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow ${isMobile ? '12s' : '8s'} linear infinite;
        }

        /* Battery-aware overrides */
        @media (prefers-reduced-motion: reduce) or (max-width: 480px) {
          .animate-spin-slow {
            animation: none;
          }
        }
      `}</style>
    </header>
  );
}

const Header = HeaderComponent;
export { Header };
export default Header;