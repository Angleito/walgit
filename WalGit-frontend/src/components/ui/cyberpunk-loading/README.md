# Cyberpunk Loading & Transition Components

This package provides a set of cyberpunk-themed loading animations, transitions, and skeletons for the WalGit application. The components are designed to enhance the user experience with immersive, futuristic visuals while maintaining accessibility.

## Components

### 1. CyberpunkLoader

A versatile loading spinner with glitch effects and neon colors.

```tsx
import { CyberpunkLoader } from "@/components/ui/loading";

// Basic usage
<CyberpunkLoader />

// With options
<CyberpunkLoader 
  variant="circuit" 
  size="lg" 
  color="purple" 
  text="Loading Repository" 
  accessibilityText="Repository data is loading" 
/>
```

#### Props

- `variant`: 'spinner' | 'pulse' | 'circuit' | 'glitch' (default: 'spinner')
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `color`: 'blue' | 'purple' | 'pink' | 'teal' | 'multi' (default: 'blue')
- `text`: Optional text to display below the loader
- `accessibilityText`: Text for screen readers (default: 'Loading')
- `ignoreReducedMotion`: Whether to ignore users' reduced motion preference (default: false)

### 2. PageTransition

Wraps page content with immersive transitions between route changes.

```tsx
import { PageTransition } from "@/components/ui/loading";

// In your layout or page component
<PageTransition variant="circuit" color="blue">
  {children}
</PageTransition>
```

#### Props

- `variant`: 'fade' | 'slide' | 'circuit' | 'glitch' (default: 'fade')
- `duration`: Transition duration in milliseconds (default: 500)
- `color`: 'blue' | 'purple' | 'pink' | 'teal' | 'multi' (default: 'blue')
- `showLoader`: Whether to show a loader during transition (default: true)
- `minLoaderTime`: Minimum time to show the loader in milliseconds (default: 300)
- `ignoreReducedMotion`: Whether to ignore users' reduced motion preference (default: false)
- `loadingText`: Text to display during loading

### 3. CyberpunkSkeleton

Placeholder loading skeletons with a tech/retro CRT feel.

```tsx
import { CyberpunkSkeleton } from "@/components/ui/loading";

// Basic text skeleton
<CyberpunkSkeleton variant="text" count={3} />

// Card skeleton
<CyberpunkSkeleton variant="card" height={200} />

// Terminal-style skeleton
<CyberpunkSkeleton variant="terminal" color="teal" count={2} />
```

#### Props

- `variant`: 'card' | 'text' | 'avatar' | 'button' | 'input' | 'code' | 'terminal' (default: 'text')
- `width`: Custom width (string or number)
- `height`: Custom height (string or number)
- `count`: Number of items to render (for text/code/terminal variants, default: 1)
- `color`: 'blue' | 'purple' | 'pink' | 'teal' | 'multi' (default: 'blue')
- `showScanline`: Whether to show the CRT scanline effect (default: true)
- `ignoreReducedMotion`: Whether to ignore users' reduced motion preference (default: false)

### 4. ProgressiveLoad

A component for progressively loading content with cyberpunk-themed skeleton placeholders.

```tsx
import { ProgressiveLoad } from "@/components/ui/loading";

// Basic usage
<ProgressiveLoad skeletonVariant="card">
  <YourContent />
</ProgressiveLoad>

// Sequential loading of multiple items
{items.map((item, index) => (
  <ProgressiveLoad
    key={item.id}
    skeletonVariant="card"
    sequential={true}
    sequenceIndex={index}
    color="blue"
  >
    <ItemCard item={item} />
  </ProgressiveLoad>
))}
```

#### Props

- `skeletonVariant`: 'card' | 'text' | 'avatar' | 'button' | 'input' | 'code' | 'terminal'
- `delay`: Default delay before showing content in ms (default: 800)
- `sequential`: Whether to load content in sequence with siblings (default: false)
- `sequenceIndex`: The order in sequence (default: 0)
- `sequenceDelay`: Delay between sequential items in ms (default: 300)
- `animate`: Whether content should animate in when loaded (default: true)
- `color`: 'blue' | 'purple' | 'pink' | 'teal' | 'multi' (default: 'blue')
- `width`, `height`, `count`: Passed to the skeleton component
- `loadOnIntersection`: Whether to load when entering viewport (default: true)
- `intersectionMargin`: Root margin for intersection observer (default: "100px")
- `onLoadStart`, `onLoadComplete`: Callback functions

### 5. LoadingSpinner

A higher-level component that provides full-screen or inline loading states.

```tsx
import { LoadingSpinner } from "@/components/ui/loading";

// Inline loader
<LoadingSpinner variant="spinner" size="md" />

// Full-screen overlay
<LoadingSpinner 
  fullScreen
  variant="circuit"
  color="purple"
  text="Processing Transaction"
  overlayOpacity={90}
  blurBackground={true}
/>
```

#### Props

- `variant`, `size`, `color`, `text`, `accessibilityText`: Same as CyberpunkLoader
- `fullScreen`: Whether to show a full-screen overlay (default: false)
- `overlayOpacity`: The opacity of the background (0-100, default: 80)
- `blurBackground`: Whether to apply a blur effect to the background (default: true)
- `ignoreReducedMotion`: Whether to ignore users' reduced motion preference (default: false)

## Accessibility Features

These components include the following accessibility features:

1. **ARIA attributes**: All components use appropriate ARIA attributes (`role="status"`, `aria-live="polite"`, `aria-busy="true"`)
2. **Text for screen readers**: Hidden text for screen readers to announce loading state
3. **Reduced motion support**: All animations respect the user's `prefers-reduced-motion` setting by default
4. **High contrast support**: Components work well in high contrast mode
5. **Keyboard accessibility**: All components work properly with keyboard navigation

## Usage Examples

### Next.js App Directory Loading

For the App Router's loading.tsx:

```tsx
// app/loading.tsx
'use client';

import { LoadingSpinner } from "@/components/ui/loading";

export default function Loading() {
  return (
    <LoadingSpinner 
      fullScreen 
      variant="circuit" 
      color="blue"
      text="Loading..." 
    />
  );
}
```

### Sequential Card Loading

```tsx
import { ProgressiveLoad } from "@/components/ui/loading";

// In your component
{repositories.map((repo, index) => (
  <ProgressiveLoad
    key={repo.id}
    skeletonVariant="card"
    sequential={true}
    sequenceIndex={index}
    sequenceDelay={150}
    color={index % 3 === 0 ? "blue" : index % 3 === 1 ? "purple" : "teal"}
  >
    <RepositoryCard repo={repo} />
  </ProgressiveLoad>
))}
```

### Skeleton States

```tsx
import { CyberpunkSkeleton } from "@/components/ui/loading";

// For a repository view with code files
<div className="space-y-4">
  <CyberpunkSkeleton variant="text" count={1} width="50%" />
  <CyberpunkSkeleton variant="code" count={5} />
  <CyberpunkSkeleton variant="text" count={2} />
  <CyberpunkSkeleton variant="terminal" count={3} />
</div>
```

### Global Page Transitions

Add to your root layout:

```tsx
// app/layout.tsx
import { PageTransition } from "@/components/ui/loading";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PageTransition 
          variant="circuit" 
          duration={600}
          minLoaderTime={400}
          loadingText="WalGit is loading..."
        >
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
```