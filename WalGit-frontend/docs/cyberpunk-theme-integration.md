# Cyberpunk Theme Integration Guide

This document outlines how to fully integrate the cyberpunk theme into existing pages and components in the WalGit application.

## Getting Started

There are two approaches to integrating the cyberpunk theme:

1. **Component Replacement**: Replace existing UI components with cyberpunk variants
2. **Theme Template Application**: Apply cyberpunk styling to existing components using theme templates

## Component Replacement

### Step 1: Import Cyberpunk Components

Replace standard UI components with their cyberpunk equivalents:

```tsx
// Before
import { Button } from "@/components/ui/button";

// After
import { CyberpunkButton } from "@/components/ui/button";
```

### Step 2: Update Component Props

Update component props to use cyberpunk variants:

```tsx
// Before
<Button variant="default">Connect Wallet</Button>

// After
<CyberpunkButton variant="neon-blue">Connect Wallet</CyberpunkButton>
```

### Common Replacements

| Standard Component | Cyberpunk Replacement |
|-------------------|------------------------|
| `Button`          | `CyberpunkButton`     |
| `Card`            | `CyberpunkCard`       |
| `Input`           | `CyberpunkInput`      |
| `Dialog`          | `CyberpunkDialog`     |
| `Select`          | `CyberpunkSelect`     |

## Theme Template Application

For sections that don't have direct component replacements, use the theme templates:

### Step 1: Import Theme Templates

```tsx
import { cyberpunkThemeTemplates } from '@/components/ui/theme-templates';
```

### Step 2: Apply Template Classes

```tsx
const { containerClass, headingClass, textClass, buttonVariant } = 
  cyberpunkThemeTemplates.repoSection;

return (
  <div className={containerClass}>
    <h2 className={headingClass}>Repository Storage</h2>
    <p className={textClass}>Decentralized storage for your Git repositories</p>
    <CyberpunkButton variant={buttonVariant}>View Details</CyberpunkButton>
  </div>
);
```

### Available Templates

- `repoSection`: Blue-centric theme for repository sections
- `profileSection`: Purple-centric theme for profile sections
- `codeSection`: Green-centric theme for code sections
- `actionSection`: Pink-centric theme for action sections
- `terminalSection`: Terminal theme for command sections
- `dashboardSection`: Dashboard theme for stats sections

## Adding Effects

Enhance sections with cyberpunk effects:

### Scanline Overlay

```tsx
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";

<div className="relative">
  <YourComponent />
  <ScanlineOverlay intensity={0.4} animated={true} />
</div>
```

### Circuit Background

```tsx
import { CircuitBackground } from "@/components/ui/circuit-background";

<div className="relative">
  <CircuitBackground color="neon-blue" animated={true} />
  <div className="relative z-10">Your content here</div>
</div>
```

## Page-Specific Integration

### Homepage

1. Replace hero section with cyberpunk hero
2. Add circuit background and scanline overlay
3. Update feature cards with CyberpunkCard
4. Apply repository section template to repository list

### Repository Page

1. Apply codeSection theme to file browser
2. Use terminalSection theme for command display
3. Add HexagonalGrid for storage visualization
4. Update buttons with neon variants

### Profile Page

1. Apply profileSection theme to user info
2. Use CyberpunkCard for repository cards
3. Add DataFlow animations between sections

## Mobile Considerations

- Use the `useMobile()` hook to render optimized versions on mobile:

```tsx
import { useMobile } from "@/hooks/use-mobile";

function MyComponent() {
  const isMobile = useMobile();
  
  return isMobile ? (
    <OptimizedCyberpunkComponent />
  ) : (
    <FullCyberpunkComponent />
  );
}
```

## Performance Tips

1. Use `React.memo` for components with expensive cyberpunk effects
2. Implement lazy loading for complex visualizations:

```tsx
const HexagonalGrid = dynamic(
  () => import('@/components/ui/hexagonal-grid'),
  { ssr: false, loading: () => <CyberpunkSkeleton /> }
);
```

3. Use reduced motion for users with motion sensitivity:

```tsx
import { useReducedMotion } from '@/hooks/use-reduced-motion';

function MyEffect() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <ScanlineOverlay 
      animated={!prefersReducedMotion}
      intensity={prefersReducedMotion ? 0.2 : 0.5} 
    />
  );
}
```

## Demo Page

For reference, see the cyberpunk demo page at `/cyberpunk-demo` which showcases all components and effects in one place.