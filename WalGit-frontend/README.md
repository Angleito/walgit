# WalGit Frontend

Frontend for WalGit - a decentralized version control system.

## Cyberpunk Theme Build Configuration

The WalGit frontend now supports a cyberpunk theme with dedicated build configurations for development and production.

### Development Configuration

The development build is optimized for rapid iteration with full visual effects:

```bash
# Use the development configuration
npm run dev:cyberpunk
```

Features in development:
- Full animation suite enabled
- CRT and glitch effects active
- Debugging tools available
- No asset optimization for faster builds
- Feature flags controlled via `.env.development`

### Production Configuration

The production build is optimized for performance and accessibility:

```bash
# Use the production configuration
npm run build:cyberpunk
```

Features in production:
- Selective animations (no performance-intensive effects)
- Optimized asset loading and code splitting
- Strict Content Security Policy
- Feature flags controlled via `.env.production`
- Full bundle optimization

### Feature Flags

Control cyberpunk theme features using environment variables:

| Flag | Description | Dev Default | Prod Default |
|------|-------------|-------------|--------------|
| `NEXT_PUBLIC_ENABLE_ANIMATIONS` | Master toggle for animations | `true` | `true` |
| `NEXT_PUBLIC_ENABLE_INTENSIVE_EFFECTS` | Heavy visual effects | `true` | `false` |
| `NEXT_PUBLIC_ENABLE_CRT_EFFECTS` | CRT monitor simulation effects | `true` | `false` |
| `NEXT_PUBLIC_ENABLE_GLITCH_EFFECTS` | Glitch visual effects | `true` | `true` |
| `NEXT_PUBLIC_ENABLE_NEON_EFFECTS` | Neon glow effects | `true` | `true` |
| `NEXT_PUBLIC_ANIMATION_INTENSITY` | Animation intensity (off/low/medium/high) | `high` | `medium` |

### Asset Optimization

The cyberpunk theme uses an advanced asset loading strategy:

- Core assets are always preloaded
- Heavy assets conditionally loaded based on device capability
- Images optimized in production builds
- Lazy loading for non-critical animations

### Content Security Policy

Production builds have a strict CSP to ensure security:

- Restricts script sources
- Controls asset loading
- Prevents XSS attacks
- Secures external resource loading

### Usage

To use different configurations:

```bash
# Start development server with cyberpunk theme
npm run dev:cyberpunk

# Build production version with cyberpunk theme
npm run build:cyberpunk

# Override feature flags
NEXT_PUBLIC_ENABLE_INTENSIVE_EFFECTS=true npm run build:cyberpunk
```

### Accessibility

The cyberpunk theme respects user preferences:

- Automatically reduces effects for `prefers-reduced-motion`
- Scales down intensity on mobile devices
- Provides user toggles for effects in the UI