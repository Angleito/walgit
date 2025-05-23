# WalGit Cyberpunk Theme Guide

This guide provides a quick overview of how to use the cyberpunk theme components in your WalGit frontend development.

## Core Components

### CyberpunkButton

```tsx
import { CyberpunkButton } from "@/components/ui/button";

// Variants: default, neon-blue, neon-purple, neon-green
<CyberpunkButton variant="neon-blue">Connect Wallet</CyberpunkButton>
```

### CyberpunkCard

```tsx
import { CyberpunkCard } from "@/components/ui/cyberpunk-card";

<CyberpunkCard>
  <h3>Repository Storage</h3>
  <p>Decentralized storage for your Git repositories</p>
</CyberpunkCard>
```

### ScanlineOverlay

```tsx
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";

// Add to any section for retro effect
<div className="relative">
  <YourComponent />
  <ScanlineOverlay intensity={0.4} animated={true} />
</div>
```

### CircuitBackground

```tsx
import { CircuitBackground } from "@/components/ui/circuit-background";

// Use as a section background
<div className="relative">
  <CircuitBackground color="neon-blue" animated={true} />
  <div className="relative z-10">Your content here</div>
</div>
```

### HexagonalGrid

```tsx
import { HexagonalGrid } from "@/components/ui/hexagonal-grid";

// Visualization for blockchain data
<HexagonalGrid 
  nodes={12} 
  activeNode={currentNode} 
  onNodeClick={handleNodeClick} 
/>
```

### CyberpunkTerminal

```tsx
import { CyberpunkTerminal } from "@/components/ui/cyberpunk-terminal";

<CyberpunkTerminal
  code={`git commit -m "Implement cyberpunk theme"`}
  language="bash"
  typingEffect={true}
/>
```

## Utility Classes

Add these classes directly to your elements:

- `text-glitch`: Adds a subtle text glitch effect
- `neon-blue-glow`: Adds blue neon glow to elements
- `neon-purple-glow`: Adds purple neon glow to elements
- `neon-green-glow`: Adds green neon glow to elements
- `cyberpunk-border`: Adds angled tech-inspired borders
- `cyberpunk-bg`: Adds dark gradient background with subtle grid
- `data-flow`: Adds data flow animation to connection lines

## Performance Considerations

- Use `useReducedMotion()` hook to respect user motion preferences
- For mobile devices, use the `useMobile()` hook to render optimized versions
- Add `low-power-mode` class conditionally for battery-aware animations

## Theme Variables

Access theme colors via CSS variables:

```css
var(--neon-blue)
var(--neon-purple)
var(--neon-green)
var(--neon-pink)
var(--cyber-dark)
var(--cyber-darker)
var(--matrix-green)
```

## Responsive Design

All cyberpunk components are responsive by default. Use the standard Tailwind breakpoints for customization.