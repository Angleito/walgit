# Circuit Background Component

The `CircuitBackground` component creates a cyberpunk-themed circuit board pattern SVG as a background visual element. It's designed to be placed behind content with reactive animation based on mouse movement and scroll position.

## Features

- Generates a randomized circuit-like pattern with nodes and connecting lines
- Reacts subtly to mouse movement and scroll position for an interactive feel
- Optimized for performance with proper z-index placement and pointer-events handling
- Configurable density, colors, and animation speed
- Fully responsive to container dimensions

## Usage

### Basic Usage

```tsx
import { CircuitBackground } from "@/components/ui/circuit-background";

<div className="relative">
  {/* The background */}
  <CircuitBackground />
  
  {/* Your content */}
  <div className="relative z-10">
    <h1>Your Content Here</h1>
  </div>
</div>
```

### With Custom Settings

```tsx
<CircuitBackground 
  lineColor="rgba(255, 0, 150, 0.3)"
  nodeColor="rgba(255, 0, 150, 0.5)"
  density={7}
  animationSpeed={5}
  className="opacity-70"
/>
```

### In a Hero Section

The component works well with our HeroSection component:

```tsx
import { HeroSection } from "@/components/layout/HeroSection";

<HeroSection
  title="Welcome to WalGit"
  subtitle="Decentralized version control"
  circuitOptions={{
    lineColor: "rgba(0, 255, 200, 0.3)",
    nodeColor: "rgba(0, 255, 200, 0.5)",
    density: 6,
    animationSpeed: 4,
  }}
>
  <Button>Get Started</Button>
</HeroSection>
```

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Additional CSS classes to apply to the container |
| `lineColor` | `string` | `"rgba(0, 255, 200, 0.3)"` | Color of the circuit lines (use rgba for transparency) |
| `nodeColor` | `string` | `"rgba(0, 255, 200, 0.5)"` | Color of the circuit nodes (use rgba for transparency) |
| `density` | `number` | `5` | Density of the circuit pattern (1-10 scale) |
| `animationSpeed` | `number` | `3` | Speed of mouse/scroll animation (1-10 scale) |

## Accessibility

The component is designed to be accessibility-friendly:
- It's marked as `aria-hidden="true"` to be hidden from screen readers
- It uses `pointer-events-none` to allow interaction with content placed above it
- It has a low z-index (`z-0`) to ensure it doesn't interfere with content

## Performance Considerations

- Uses React's `useRef` to hold references to DOM elements
- The circuit pattern is only regenerated when the container size changes
- Animation is handled with CSS transforms for smooth performance
- The component is responsive and adapts to the parent container size

## Example Theme Combinations

| Theme | Line Color | Node Color |
|-------|------------|------------|
| Cyberpunk Blue | `rgba(0, 180, 255, 0.3)` | `rgba(0, 180, 255, 0.5)` |
| Neon Green | `rgba(0, 255, 128, 0.3)` | `rgba(0, 255, 128, 0.5)` |
| Retro Purple | `rgba(180, 0, 255, 0.3)` | `rgba(180, 0, 255, 0.5)` |
| Hacker Red | `rgba(255, 0, 0, 0.3)` | `rgba(255, 50, 50, 0.5)` |