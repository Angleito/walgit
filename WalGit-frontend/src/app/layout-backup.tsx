import { Metadata, Viewport } from 'next';
import { Orbitron, Rajdhani } from 'next/font/google';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers';
import { CyberpunkEffectsProvider } from '@/components/ui/cyberpunk-effects-provider';
import ScanlineOverlay from '@/components/ui/scanline-overlay';
import CircuitBackground from '@/components/ui/circuit-background';
import { Header } from '@/components/layout/Header';
import CyberpunkSidebar from '@/components/layout/CyberpunkSidebar';
import LayoutWrapper from './LayoutWrapper';

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Site metadata
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'WalGit | Decentralized Version Control',
  description: 'Decentralized version control built on Sui blockchain with Walrus storage',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/walgitlogo.png', sizes: '32x32', type: 'image/png' },
      { url: '/walgitlogo.png', sizes: '192x192', type: 'image/png' },
      { url: '/walgitlogo.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/walgitlogo.png',
  },
  openGraph: {
    title: 'WalGit | Decentralized Version Control',
    description: 'Decentralized version control built on Sui blockchain with Walrus storage',
    url: 'https://walgit.io',
    siteName: 'WalGit',
    images: [
      {
        url: '/walgitlogo.png',
        width: 1024,
        height: 1024,
        alt: 'WalGit Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WalGit | Decentralized Version Control',
    description: 'Decentralized version control built on Sui blockchain with Walrus storage',
    creator: '@walgit',
    images: ['/walgitlogo.png'],
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0d1117' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        rajdhani.variable,
        orbitron.variable,
        inter.variable,
        "dark" // Always use dark mode for cyberpunk theme
      )}
    >
      <head>
        <link rel="icon" type="image/png" href="/walgitlogo.png" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-[#0d1117] font-sans antialiased text-[#c9d1d9]",
          "cyberpunk-theme"
        )}
      >
        <Providers>
          <Header className="fixed top-0 left-0 right-0 z-50" />
          <CyberpunkSidebar />

          <LayoutWrapper>
            <CyberpunkEffectsProvider>
              {/* Subtle cyberpunk elements that don't dominate the layout */}
              <div className="absolute inset-0 cyber-grid-detailed opacity-5 z-0"></div>

              <CircuitBackground
                className="absolute inset-0 z-0 opacity-10"
                lineColor="rgba(5, 217, 232, 0.1)"
                nodeColor="rgba(0, 215, 255, 0.15)"
                density={3}
                animationSpeed={1}
                interactive={false}
              />

              {/* Holographic overlay pattern */}
              <div className="absolute inset-0 bg-holographic opacity-[0.02] mix-blend-screen z-0"></div>

              {/* Main content with cyberpunk styling */}
              <main className="relative z-10 min-h-screen">
                {children}
              </main>

              {/* Scanline overlay */}
              <ScanlineOverlay
                className="pointer-events-none z-20"
                intensity={0.3}
                speed={2}
                gap={100}
                thickness={1}
              />
            </CyberpunkEffectsProvider>
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}