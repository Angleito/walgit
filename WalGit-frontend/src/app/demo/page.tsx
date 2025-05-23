'use client';

import Link from 'next/link';
import { Terminal, Sparkles, Layers, Cpu } from 'lucide-react';
import { CyberpunkCard } from '@/components/ui/cyberpunk-card';
import { ResponsiveCyberpunkButton } from '@/components/ui/responsive-cyberpunk-ui';

interface DemoItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const demoItems: DemoItem[] = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk UI Components',
    description: 'Experience our full cyberpunk theme with animated components and effects',
    href: '/cyberpunk-demo',
    icon: Sparkles,
    badge: 'Popular',
  },
  {
    id: 'phase1',
    title: 'GitHub-like UI',
    description: 'Explore our GitHub-inspired interface with WalGit&apos;s decentralized twist',
    href: '/demo/phase1',
    icon: Layers,
  },
  {
    id: 'crt',
    title: 'CRT Terminal Effect',
    description: 'Retro terminal experience with authentic CRT monitor effects',
    href: '/demo/crt-effect',
    icon: Terminal,
    badge: 'Retro',
  },
  {
    id: 'cyberpunk-terminal',
    title: 'Cyberpunk Terminal',
    description: 'Interactive terminal with hacker-style interface and commands',
    href: '/demo/cyberpunk-terminal',
    icon: Cpu,
    badge: 'New',
  },
];

export default function DemoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-[#05d9e8] via-[#d16aff] to-[#ff2a6d] bg-clip-text text-transparent">
            WalGit Demos
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Explore the cutting-edge features and stunning UI components that make WalGit unique
        </p>
      </div>

      {/* Demo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {demoItems.map((demo) => {
          const Icon = demo.icon;
          return (
            <Link key={demo.id} href={demo.href}>
              <CyberpunkCard
                variant="blue"
                className="p-6 h-full hover:shadow-[0_0_30px_rgba(5,217,232,0.5)] transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-6 h-6 text-[#05d9e8]" />
                      <h3 className="text-xl font-semibold text-white group-hover:text-[#05d9e8] transition-colors">
                        {demo.title}
                      </h3>
                    </div>
                    <p className="text-gray-400">{demo.description}</p>
                  </div>
                  {demo.badge && (
                    <span className="px-2 py-1 text-xs font-medium bg-[#ff2a6d]/20 text-[#ff2a6d] border border-[#ff2a6d]/30 rounded-full">
                      {demo.badge}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <span className="text-[#05d9e8] group-hover:text-[#00ff9f] transition-colors text-sm font-medium">
                    View Demo →
                  </span>
                </div>
              </CyberpunkCard>
            </Link>
          );
        })}
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <CyberpunkCard
          variant="purple"
          glassMorphism={true}
          className="p-8 max-w-2xl mx-auto"
        >
          <h2 className="text-2xl font-bold mb-4 text-white">
            Ready to Build with WalGit?
          </h2>
          <p className="text-gray-300 mb-6">
            Start creating your decentralized repositories with our powerful features and beautiful UI
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/new-repository">
              <ResponsiveCyberpunkButton variant="cyberNeon" size="lg">
                Create Repository
              </ResponsiveCyberpunkButton>
            </Link>
            <Link href="/repositories">
              <ResponsiveCyberpunkButton variant="cyberGlitch" size="lg">
                Browse Repositories
              </ResponsiveCyberpunkButton>
            </Link>
          </div>
        </CyberpunkCard>
      </div>
    </div>
  );
}