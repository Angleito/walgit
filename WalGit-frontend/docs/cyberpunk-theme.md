# Cyberpunk Theme Documentation

## Table of Contents

1. [Overview](#overview)
2. [Design System](#design-system)
3. [Component API Reference](#component-api-reference)
4. [Usage Examples](#usage-examples)
5. [Performance Considerations](#performance-considerations)
6. [Accessibility Guidelines](#accessibility-guidelines)

## Overview

The WalGit cyberpunk theme is a comprehensive visual styling system that brings a futuristic, neon-lit aesthetic to the application. Inspired by cyberpunk visual culture, this theme features glowing elements, digital glitches, neon colors, and angular geometric shapes that create an immersive and distinctive user experience.

The theme is fully responsive, with special optimizations for mobile devices, and supports both light and dark modes. It includes accessibility considerations and performance optimizations to ensure a smooth experience across different devices.

## Design System

### Color Palette

The cyberpunk theme uses a distinctive color palette centered around high-contrast, neon colors:

| Color Name | Primary (Hex) | Glow/Secondary (Hex) | Usage |
|------------|--------------|---------------------|-------|
| Blue | `#05d9e8` | `rgba(5, 217, 232, 0.5)` | Primary accent, buttons, interactive elements |
| Pink/Red | `#ff2a6d` | `rgba(255, 42, 109, 0.5)` | Secondary accent, warnings, destructive actions |
| Teal | `#00ff9f` | `rgba(0, 255, 159, 0.5)` | Success states, confirmations |
| Purple | `#c900ff` | `rgba(201, 0, 255, 0.5)` | Highlights, alternate accent |
| Dark | `#0b0b16` | N/A | Main background (dark mode) |
| Light | `#f0f0f0` | N/A | Main background (light mode) |

### Typography

The cyberpunk theme uses a combination of monospace and sans-serif fonts for a technical, futuristic look:

- **Primary Font**: `"JetBrains Mono", Menlo, Monaco, "Courier New", monospace` for code, terminal interfaces, and accents
- **Secondary Font**: System sans-serif stack for general UI text
- **Font Sizes**: Follows a scale from 0.75rem to 3rem with sufficient contrast between headings and body text
- **Text Effects**: Uses neon glow effects, text shadows, and custom animations for emphasized text

### Visual Elements

1. **Neon Borders**
   - Thin borders (1-2px) with glow effects
   - Color-specific shadows to create a neon light appearance
   - Angular shapes with clip paths for geometric styling

2. **Scanlines**
   - Subtle scanline overlays for terminals and cards
   - Variable opacity based on user preferences and device capability

3. **Glitch Effects**
   - Controlled animations that create digital "glitch" aesthetics
   - Used sparingly for interactive elements and loading states
   - Respects reduced motion preferences

4. **Angular Geometry**
   - Asymmetric clipping paths and angular corners
   - Inspired by cyberpunk UI conventions from fiction

5. **Depth & Layering**
   - Subtle backdrop blur effects
   - Gradient overlays to create depth
   - Shadow work to establish visual hierarchy

## Component API Reference

### CyberpunkCard

A card component with neon borders, glowing effects, and cyberpunk-inspired corner accents.

```tsx
import { CyberpunkCard } from '@/components/ui/cyberpunk-card';

<CyberpunkCard
  title="Feature Name"
  description="Description text goes here"
  icon={<Icon />}
  glowColor="blue"
  className="custom-class"
  onClick={handleClick}
/>
```

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | Required | Card title displayed with gradient effect |
| `description` | string | Required | Main content text for the card |
| `icon` | ReactNode | undefined | Optional icon to display at the top of the card |
| `glowColor` | 'blue' \| 'violet' \| 'emerald' \| 'red' \| 'amber' \| 'mixed' | 'blue' | Color theme for the card's neon effects |
| `className` | string | '' | Additional CSS classes |
| `onClick` | () => void | undefined | Optional click handler |

### CyberpunkTerminal

A terminal-like interface for code display with scanlines, syntax highlighting, and typing animations.

```tsx
import { CyberpunkTerminal } from '@/components/ui/cyberpunk-terminal';

<CyberpunkTerminal
  code="const hello = 'world';"
  language="javascript"
  title="terminal@walgit:~$"
  showLineNumbers={true}
  darkMode={true}
  animateTyping={true}
  typingSpeed={20}
  onThemeToggle={toggleTheme}
/>
```

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | string | Required | The code or text to display in the terminal |
| `language` | string | 'javascript' | Programming language for syntax highlighting |
| `title` | string | 'terminal@walgit:~$' | Text displayed in the terminal title bar |
| `typingSpeed` | number | 20 | Speed of typing animation in milliseconds |
| `showLineNumbers` | boolean | true | Whether to display line numbers |
| `className` | string | undefined | Additional CSS classes |
| `darkMode` | boolean | true | Toggle between dark and light terminal theme |
| `onThemeToggle` | () => void | undefined | Handler for theme toggle button |
| `animateTyping` | boolean | true | Whether to animate the code typing effect |

### CyberpunkNavBar

A navigation bar with glitching effects, neon highlights, and cyberpunk styling.

```tsx
import CyberpunkNavBar from '@/components/layout/CyberpunkNavBar';

<CyberpunkNavBar
  logoComponent={<Logo />}
  navItems={[
    { label: 'Home', href: '/' },
    { label: 'Repositories', href: '/repositories' }
  ]}
  rightActions={<CustomActions />}
/>
```

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | string | undefined | Additional CSS classes |
| `logoComponent` | ReactNode | Required | Component to render as the logo |
| `navItems` | Array<{ label: string, href: string }> | Required | Navigation links to display |
| `rightActions` | ReactNode | undefined | Optional right-side actions (defaults to sign in/up buttons) |

### CyberpunkLoader

A loading indicator with multiple variants and cyberpunk styling.

```tsx
import { CyberpunkLoader } from '@/components/ui/cyberpunk-loader';

<CyberpunkLoader
  size="md"
  variant="spinner"
  color="blue"
  text="Loading..."
  accessibilityText="Loading repository data"
/>
```

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | 'sm' \| 'md' \| 'lg' \| 'xl' | 'md' | Size of the loader |
| `variant` | 'spinner' \| 'pulse' \| 'circuit' \| 'glitch' | 'spinner' | Visual style of the loader |
| `color` | 'blue' \| 'purple' \| 'pink' \| 'teal' \| 'multi' | 'blue' | Color theme for the loader |
| `className` | string | undefined | Additional CSS classes |
| `text` | string | undefined | Optional text to display below the loader |
| `accessibilityText` | string | 'Loading' | Text for screen readers |
| `ignoreReducedMotion` | boolean | false | When true, animations play regardless of user's motion preferences |

### MobileCyberpunkTheme

A mobile-optimized theme controller with battery-saving options.

```tsx
import { MobileCyberpunkTheme } from '@/components/ui/mobile-cyberpunk-theme';

<MobileCyberpunkTheme />
```

This component has no props but internally handles:
- Theme intensity levels (high, medium, low)
- Battery optimizations
- Mobile-specific visual adjustments
- Persistent theme preferences

### Other Components

- **CyberpunkScanlineCard**: Card with more prominent scanline effects
- **CyberpunkSkeleton**: Loading skeleton with cyberpunk styling
- **ResponsiveCyberpunkUI**: Adaptive layout components
- **MobileCyberpunkButton**: Touch-optimized buttons with cyberpunk styling
- **MobileCyberpunkCard**: Mobile-optimized card components
- **MobileCyberpunkNavigation**: Mobile navigation with cyberpunk styling

## Usage Examples

### Basic Theme Implementation

```tsx
// pages/_app.tsx or src/app/providers.tsx
import { ThemeProvider } from '@/components/ui/theme-switcher';
import '@/components/ui/mobile-cyberpunk.css';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider defaultTheme="dark" defaultAccent="blue">
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
```

### Repository Card with Cyberpunk Styling

```tsx
import { CyberpunkCard } from '@/components/ui/cyberpunk-card';
import { GitBranch } from 'lucide-react';

export function RepositoryCard({ repo }) {
  return (
    <CyberpunkCard
      title={repo.name}
      description={repo.description || 'No description provided'}
      icon={<GitBranch className="w-6 h-6 text-blue-400" />}
      glowColor={repo.isPrivate ? 'violet' : 'blue'}
      onClick={() => router.push(`/repositories/${repo.owner}/${repo.name}`)}
    />
  );
}
```

### Code Display with CyberpunkTerminal

```tsx
import { CyberpunkTerminal } from '@/components/ui/cyberpunk-terminal';
import { useTheme } from '@/components/ui/theme-switcher';

export function CodeViewer({ code, language }) {
  const { theme, setTheme } = useTheme();
  
  return (
    <CyberpunkTerminal
      code={code}
      language={language}
      title={`${language}@walgit:~$`}
      darkMode={theme === 'dark'}
      onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    />
  );
}
```

### Loading State with CyberpunkLoader

```tsx
import { CyberpunkLoader } from '@/components/ui/cyberpunk-loader';

export function LoadingState({ isLoading, children }) {
  return isLoading ? (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <CyberpunkLoader 
        variant="circuit" 
        size="lg" 
        color="multi" 
        text="Establishing connection..."
      />
    </div>
  ) : children;
}
```

### Navigation with CyberpunkNavBar

```tsx
import CyberpunkNavBar from '@/components/layout/CyberpunkNavBar';
import { useWallet } from '@/services/wallet';
import { WalletProfile } from '@/components/wallet/WalletProfile';

export function Header() {
  const { isConnected, connect } = useWallet();
  
  return (
    <CyberpunkNavBar
      logoComponent={<img src="/walgitlogo.png" alt="WalGit" className="h-8" />}
      navItems={[
        { label: 'Home', href: '/' },
        { label: 'Repositories', href: '/repositories' },
        { label: 'Documentation', href: '/docs' }
      ]}
      rightActions={
        isConnected ? (
          <WalletProfile />
        ) : (
          <button onClick={connect} className="cyberpunk-button">
            Connect Wallet
          </button>
        )
      }
    />
  );
}
```

## Performance Considerations

### Mobile Optimizations

The cyberpunk theme includes specific optimizations for mobile devices:

1. **Intensity Levels**
   - High: Full visual effects (not recommended for older devices)
   - Medium: Balanced effects with some optimizations (default)
   - Low: Minimal effects for battery saving and performance

2. **Reduced Animation Options**
   - Auto-detection of `prefers-reduced-motion` system setting
   - Battery-saving mode with minimal animations
   - Customizable animation speed multipliers

3. **Rendering Optimizations**
   - Hardware-accelerated animations where appropriate (`transform`, `opacity`)
   - Reduced blur radius and shadow complexity on mobile
   - Limited number of animated elements on screen

4. **Implementation**

```tsx
// Example of performance-aware component
function OptimizedCyberpunkElement({ children }) {
  const isMobile = useIsMobile();
  const prefersReducedMotion = 
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;
  
  const animationSpeed = isMobile ? '0.7' : '1';
  const glowIntensity = (isMobile && prefersReducedMotion) ? '0.2' : '0.5';
  
  return (
    <div 
      className="cyberpunk-element"
      style={{ 
        '--animation-speed': animationSpeed,
        '--glow-intensity': glowIntensity
      }}
    >
      {children}
    </div>
  );
}
```

### Desktop Best Practices

1. **Selective Animation**
   - Apply animations only where they enhance user experience
   - Use `IntersectionObserver` to activate animations only when visible
   - Limit simultaneous animations to prevent performance issues

2. **Layer Management**
   - Minimize the number of elements with `box-shadow` and `filter` effects
   - Use CSS variables to dynamically adjust effect intensity
   - Group elements that can share the same effect

3. **Rendering Tips**
   - Use `will-change` judiciously for elements with frequent animations
   - Promote elements to their own layer when appropriate
   - Avoid repeatedly animating large areas of the screen

4. **Example Implementation**

```tsx
// Example of high-performance animation
import { useEffect, useRef } from 'react';

function OptimizedCyberpunkAnimation() {
  const elementRef = useRef(null);
  
  useEffect(() => {
    if (!elementRef.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-cyberpunk');
        } else {
          entry.target.classList.remove('animate-cyberpunk');
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);
  
  return (
    <div 
      ref={elementRef}
      className="cyberpunk-element"
    >
      Optimized animation
    </div>
  );
}
```

## Accessibility Guidelines

### Color and Contrast

1. **Contrast Requirements**
   - All text meets WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
   - Interactive elements have at least 3:1 contrast with surrounding content
   - Neon glow effects enhance, but do not replace, proper contrast

2. **Color Independence**
   - Information is never conveyed by color alone
   - Icons, text labels, or patterns accompany color differences
   - Alternative visual cues for color-based states

### Motion and Animation

1. **Respecting User Preferences**
   - All animations respect the `prefers-reduced-motion` setting
   - Critical components like CyberpunkLoader check this preference
   - Alternative static presentations when animations are disabled

2. **Animation Controls**
   - Users can adjust animation intensity via MobileCyberpunkTheme
   - Battery-saving mode reduces animation frequency and intensity
   - Important UI elements function without requiring animation

3. **Implementation Example**

```tsx
// Animation respecting user preferences
const prefersReducedMotion = 
  typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

const animationClass = prefersReducedMotion 
  ? 'no-animation'
  : 'cyberpunk-animation';
```

### Keyboard and Screen Reader Support

1. **Focus Management**
   - All interactive elements have visible focus states with cyberpunk styling
   - Focus states meet contrast requirements (3:1 against background)
   - Navigation sequences follow logical order

2. **Screen Reader Support**
   - Proper ARIA roles for custom components
   - Descriptive labels for interactive elements
   - Loading states correctly announced (e.g., CyberpunkLoader uses aria-live)

3. **Implementation Example**

```tsx
// Accessible cyberpunk button
<button
  className="cyberpunk-button"
  aria-label="Create new repository"
  role="button"
>
  <span className="cyberpunk-button-text">Create Repo</span>
  <span className="cyberpunk-button-glow" aria-hidden="true"></span>
</button>
```

### Text Readability

1. **Typography Guidelines**
   - Minimum text size of 16px (1rem) for body text
   - Avoid using thin font weights with glow effects
   - Sufficient spacing between lines and paragraphs

2. **Glow Effect Moderation**
   - Text shadow effects optimized for readability
   - Glow effects primarily applied to headings and UI accents
   - Option to reduce glow intensity in accessibility settings

3. **Readable Alternative**
   - The `cyber-readable-text` class removes glow effects for better readability
   - Use for long-form content and critical information

### Themes and Light Sensitivity

1. **Theme Options**
   - Both light and dark cyberpunk themes available
   - Light theme reduces intense contrast for light-sensitive users
   - Theme preferences persisted between sessions

2. **Glitch Effect Considerations**
   - Glitch animations limited in frequency and duration
   - No full-screen flashing effects
   - Option to disable glitch effects entirely

3. **Implementation Example**

```tsx
// Theme-aware component with accessibility considerations
function AccessibleCyberpunkElement({ children }) {
  const { theme } = useTheme();
  
  return (
    <div className={`
      cyberpunk-element
      ${theme === 'light' ? 'cyberpunk-light' : 'cyberpunk-dark'}
    `}>
      {children}
      <style jsx>{`
        .cyberpunk-light {
          --glow-opacity: 0.3;
          --flash-intensity: 0.1;
        }
        .cyberpunk-dark {
          --glow-opacity: 0.5;
          --flash-intensity: 0.15;
        }
        @media (prefers-reduced-motion: reduce) {
          .cyberpunk-element {
            --flash-intensity: 0;
          }
        }
      `}</style>
    </div>
  );
}
```