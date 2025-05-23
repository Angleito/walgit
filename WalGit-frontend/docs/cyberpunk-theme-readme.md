# WalGit Cyberpunk Theme

The WalGit Cyberpunk Theme is a complete redesign of the WalGit frontend with a futuristic, crypto-inspired aesthetic featuring neon colors, tech-inspired UI elements, and immersive visual effects.

## Overview

This theme transforms WalGit into a visually striking application that enhances the user experience while maintaining all functionality. It's designed to be:

- **Visually distinct**: Cyberpunk-inspired design with neon accents and tech aesthetics
- **Performant**: Optimized for all devices with battery and motion-sensitive adaptations
- **Accessible**: All effects can be disabled for users with motion sensitivity
- **Modular**: Components can be used individually or together
- **Configurable**: Feature flags control animation intensity and special effects

## Getting Started

To run WalGit with the cyberpunk theme:

```bash
# Development with full effects
npm run dev:cyberpunk

# Production build with optimized effects
npm run build:cyberpunk
```

## Configuration

The cyberpunk theme can be configured through environment variables or the `cyberpunk.config.js` file:

```js
// .env.local
NEXT_PUBLIC_THEME_VARIANT=cyberpunk
NEXT_PUBLIC_ENABLE_ANIMATIONS=true
NEXT_PUBLIC_ENABLE_INTENSIVE_EFFECTS=true
NEXT_PUBLIC_ENABLE_CRT_EFFECTS=true
NEXT_PUBLIC_ANIMATION_INTENSITY=medium
```

## Component System

The theme includes specialized components for creating cyberpunk interfaces:

- **CyberpunkButton**: Buttons with neon glow effects and angular design
- **CyberpunkCard**: Content cards with tech-inspired borders and hover effects
- **ScanlineOverlay**: CRT-style scanline effect for retro-futuristic sections
- **CircuitBackground**: Animated circuit pattern backgrounds
- **HexagonalGrid**: Interactive blockchain node visualization
- **CyberpunkTerminal**: Terminal-style command display with typing effects

## Documentation

Comprehensive documentation is available for the cyberpunk theme:

- [Component Guide](./cyberpunk-theme-guide.md): Usage examples for all components
- [Theme Integration](./cyberpunk-theme-integration.md): How to apply the theme to existing pages
- [Browser Compatibility](./cyberpunk-browser-compatibility.md): Browser support and fallbacks

## Performance Considerations

The cyberpunk theme includes multiple performance optimizations:

- **Battery Awareness**: Reduced effects on mobile devices in low power mode
- **Motion Sensitivity**: Respects user preferences for reduced motion
- **Code Splitting**: Theme components are loaded only when needed
- **Asset Optimization**: Compressed and optimized visual assets

## Accessibility

The cyberpunk theme prioritizes accessibility:

- All animations can be disabled via CSS `prefers-reduced-motion`
- Contrast ratios meet WCAG AA standards for text readability
- Interactive elements maintain proper focus states
- Keyboard navigation is fully supported

## Demo

A full demo showcasing all cyberpunk components is available at:

```
/cyberpunk-demo
```

This page demonstrates the theme components in action with examples of different layouts and interactive elements.

## Browser Support

The cyberpunk theme is tested and supported on:

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

For older browsers, a compatibility mode is used that preserves functionality while falling back to simpler visual styling.

## Credits

The WalGit Cyberpunk Theme was designed and implemented for the WalGit decentralized version control system, combining blockchain technology with a futuristic user experience.