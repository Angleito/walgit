# WalGit Cyberpunk Typography System

This document outlines the cyberpunk-inspired typography system used in the WalGit project.

## Fonts

The system uses three primary fonts:

1. **Orbitron** - A futuristic, geometric sans-serif font used for display text and headlines
   - Used for high-impact display text and major headings
   - Available via the `font-display` class in Tailwind

2. **Rajdhani** - A modern, techno-inspired sans-serif font with a distinctive geometric style
   - Used for headings, subheadings, and body text
   - Available via the standard `font-sans` class in Tailwind

3. **Geist Mono** - A clean, modern monospace font optimized for code and technical content
   - Used exclusively for code blocks, terminal outputs, and technical content
   - Available via the `font-mono` class in Tailwind

## Type Scale

The typography system uses a structured type scale with defined sizes:

| Class | Size | Usage |
|-------|------|-------|
| `--font-display-1` | 3.5rem (56px) | Hero titles, main banners |
| `--font-display-2` | 2.5rem (40px) | Section headers |
| `--font-display-3` | 2rem (32px) | Feature titles |
| `--font-heading-1` | 1.75rem (28px) | Major headings |
| `--font-heading-2` | 1.5rem (24px) | Secondary headings |
| `--font-heading-3` | 1.25rem (20px) | Minor headings |
| `--font-body` | 1rem (16px) | Body text |
| `--font-small` | 0.875rem (14px) | Small text, captions |
| `--font-tiny` | 0.75rem (12px) | Fine print, footnotes |

## Utility Classes

For convenience, the following utility classes are provided:

### Typography Classes

| Class | Description |
|-------|-------------|
| `.display-1` | Largest display text using Orbitron |
| `.display-2` | Medium display text using Orbitron |
| `.display-3` | Smaller display text using Orbitron |
| `.heading-1` | Major heading using Rajdhani |
| `.heading-2` | Secondary heading using Rajdhani |
| `.heading-3` | Minor heading using Rajdhani |
| `.text-body` | Standard body text using Rajdhani |
| `.text-small` | Small text using Rajdhani |
| `.text-tiny` | Tiny text using Rajdhani |
| `.code-block` | Code block formatting using Geist Mono |
| `.code-inline` | Inline code formatting using Geist Mono |

### Cyberpunk Text Effects

The system also includes several cyberpunk-style text effects:

| Class | Description |
|-------|-------------|
| `.text-glitch` | Adds a glitch effect on hover (use with `data-text` attribute) |
| `.cyber-gradient-text` | Multi-color gradient text with animation |
| `.text-scanner` | Adds a scanning highlight effect |
| `.cyberpunk-text` | Basic cyberpunk text with glow effect |

## Neon Color Palette

The typography is complemented by a neon color palette:

| Variable | Color | Usage |
|----------|-------|-------|
| `--neon-blue` | #00eeff | Primary accent |
| `--neon-purple` | #d900ff | Secondary accent |
| `--neon-teal` | #00ffb3 | Tertiary accent |
| `--neon-pink` | #ff2cdf | Quaternary accent |
| `--neon-yellow` | #f9f002 | Highlight accent |

## Example Usage

```jsx
// Headline with neon glow
<h1 className="display-1 text-neon-blue cyberpunk-text">
  WalGit Future
</h1>

// Subheading
<h2 className="heading-2 text-white">
  Decentralized Version Control
</h2>

// Body text
<p className="text-body text-white">
  WalGit combines the power of Git with blockchain technology.
</p>

// Code block
<div className="code-block">
  <pre><code>
    // Example code
    const repo = await Repository.init('./project');
  </code></pre>
</div>

// Special effects
<p className="text-body text-glitch" data-text="Glitch Effect">
  Glitch Effect
</p>

<p className="text-body cyber-gradient-text">
  Gradient Text
</p>
```

## Responsive Considerations

The typography system is designed to be responsive, with text sizes that adjust smoothly across different viewport sizes. For very small screens, consider reducing the display font sizes further or providing alternative layouts for the most impactful text elements.

## Implementation Details

The typography system is implemented using:

1. Next.js font system with `next/font/google` for optimized font loading
2. CSS variables for the type scale and font properties
3. Tailwind CSS for responsive design and utility classes
4. Custom CSS for the cyberpunk effects

All typography CSS is defined in `globals.css` with font loading configured in `layout.tsx`.