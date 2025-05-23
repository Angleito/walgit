# WalGit UI Mockups & Design Specification

## Overview

This document provides comprehensive UI mockups and design specifications for the WalGit decentralized version control platform. The design follows a cyberpunk aesthetic with modern usability principles, ensuring both visual appeal and functional excellence.

## Design System

### Color Palette

#### Primary Colors
- **Cyber Blue**: `#00D4FF` - Primary actions, links, highlights
- **Neon Green**: `#39FF14` - Success states, active elements
- **Electric Purple**: `#8A2BE2` - Secondary actions, accents
- **Plasma Pink**: `#FF1493` - Error states, warnings

#### Neutral Colors
- **Deep Black**: `#0A0A0F` - Primary background
- **Carbon Gray**: `#1A1A2E` - Secondary background
- **Steel Gray**: `#2D2D44` - Card backgrounds, panels
- **Silver**: `#C0C0C0` - Text primary
- **Dim Silver**: `#888899` - Text secondary
- **Overlay**: `rgba(42, 42, 66, 0.8)` - Modal overlays

### Typography

#### Primary Font Stack
```css
font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Consolas', monospace;
```

#### Font Weights & Sizes
- **Headers**: 600-700 weight, 24-48px
- **Body Text**: 400-500 weight, 14-16px
- **Code**: 400 weight, 13-14px
- **Labels**: 500-600 weight, 12-14px

### Spacing & Layout

#### Grid System
- **Base Unit**: 8px
- **Container Max Width**: 1200px
- **Breakpoints**:
  - Mobile: 320px - 768px
  - Tablet: 768px - 1024px
  - Desktop: 1024px+

#### Spacing Scale
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px
- XXL: 48px

## Screen-by-Screen Mockups

### 1. Landing Page

```
┌─────────────────────────────────────────────────────────────────┐
│ [🦭 WalGit]                    [Docs] [About] [Connect Wallet] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│           🌊 DECENTRALIZED VERSION CONTROL 🔐                   │
│                                                                 │
│              Take back control of your code                     │
│                                                                 │
│    [🚀 Get Started]           [📖 Learn More]                  │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  🔒 Encrypted   │ │  🌐 Distributed │ │  👥 Collaborative│   │
│  │     Storage     │ │     Network     │ │     Features     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│                      Recent Activity                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 📊 1,234 repositories created                              │ │
│  │ 🔄 5,678 commits pushed today                              │ │
│  │ 👥 345 developers joined this week                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Features
- Animated background with subtle circuit patterns
- Glowing CTA buttons with hover effects
- Real-time statistics counter
- Responsive hero section

### 2. Wallet Connection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Connect Your Wallet                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         Choose your preferred Sui wallet:                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [💼] Sui Wallet                                     [→]   │ │
│  │      Browser extension wallet                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [⚡] Ethos Wallet                                   [→]   │ │
│  │      Multi-platform wallet                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [🔗] WalletConnect                                  [→]   │ │
│  │      Connect mobile wallets                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                [Need a wallet? Get one here]                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ℹ️ Your wallet will be used to:                            │ │
│  │ • Sign transactions for repository operations              │ │
│  │ • Manage storage quota and payments                        │ │
│  │ • Access encrypted repositories                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                          [Cancel]                              │
└─────────────────────────────────────────────────────────────────┘
```

#### Interaction States
- **Loading**: Spinner with "Connecting..." text
- **Error**: Red glow with error message and retry button
- **Success**: Green checkmark with "Connected" message

### 3. Repository Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ [🦭] WalGit    [🔍 Search]         [🔔] [⚙️] [👤 0x1234...89a] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Dashboard                                    [+ New Repository] │
│                                                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│ │  📊 Storage     │ │  🏆 Activity    │ │  👥 Teams       │     │
│ │     2.4GB       │ │    12 commits   │ │    3 active     │     │
│ │   Used / 5GB    │ │    this week    │ │    invites      │     │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘     │
│                                                                 │
│ Your Repositories                              [Grid] [List]    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔒 my-secret-project                            [⭐ 12]    │ │
│ │ Private • Updated 2 hours ago                              │ │
│ │ TypeScript • 2.3MB • 3 collaborators                      │ │
│ │ [📝 Commit] [👥 Share] [⚙️ Settings]                      │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 🌐 walgit-documentation                         [⭐ 45]    │ │
│ │ Public • Updated 1 day ago                                 │ │
│ │ Markdown • 856KB • 12 contributors                        │ │
│ │ [📝 Commit] [🔀 Fork] [👁️ Watch]                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Recent Activity                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔄 Alice pushed 3 commits to my-secret-project            │ │
│ │ 👥 Bob requested access to data-analysis                  │ │
│ │ 📋 New issue opened in walgit-docs                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Interactive Elements
- Search with autocomplete suggestions
- Repository cards with hover animations
- Real-time activity feed updates
- Drag-and-drop repository organization

### 4. Repository Creation Wizard

```
┌─────────────────────────────────────────────────────────────────┐
│                     Create New Repository                       │
│                                                                 │
│ ●━━━━━━━━○━━━━━━━━○━━━━━━━━○  Step 2 of 4: Configuration         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Repository Details                                              │
│                                                                 │
│ Repository Name *                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ my-awesome-project                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ✅ Available                                                    │
│                                                                 │
│ Description                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ An awesome project built with WalGit...                    │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Visibility                                                      │
│ ◉ Public    Anyone can view and clone                          │
│ ○ Private   Only you and collaborators can access              │
│                                                                 │
│ Advanced Options                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ☑️ Enable encryption (SEAL threshold encryption)            │ │
│ │ ☑️ Initialize with README                                   │ │
│ │ ☐ Add .gitignore template                                  │ │
│ │ ☐ Choose a license                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Default Branch                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ main                                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│              [← Back]              [Continue →]                │
└─────────────────────────────────────────────────────────────────┘
```

#### Validation & Feedback
- Real-time name availability checking
- Character count for description
- Encryption option with explanatory tooltip
- Template selection with previews

### 5. Repository File Browser

```
┌─────────────────────────────────────────────────────────────────┐
│ [🦭] walgit  /  alice  /  my-project                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ⭐ 45    🍴 12    👁️ 8    📊 2.3MB                              │
│                                                                 │
│ [Code] [Issues] [Pull Requests] [Actions] [Settings]           │
│                                                                 │
│ 📁 src  /  components  /  ui                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Latest commit: "Fix button styling" • 2 hours ago          │ │
│ │ 📝 by Alice (alice.eth) • SHA: a1b2c3d                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [📁 Clone] [📦 Download] [📤 Upload] [➕ New File]             │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Name                    │ Size    │ Last Modified          │ │
│ ├─────────────────────────┼─────────┼────────────────────────┤ │
│ │ 📁 ..                   │   -     │         -              │ │
│ │ 📄 button.tsx          │ 2.1 KB  │ 2 hours ago            │ │
│ │ 📄 card.tsx            │ 1.8 KB  │ 1 day ago              │ │
│ │ 📄 dialog.tsx          │ 3.2 KB  │ 3 days ago             │ │
│ │ 📄 input.tsx           │ 1.5 KB  │ 1 week ago             │ │
│ │ 📄 index.ts            │ 856 B   │ 2 weeks ago            │ │
│ └─────────────────────────┴─────────┴────────────────────────┘ │
│                                                                 │
│ README.md                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ # My Awesome Project                                        │ │
│ │                                                             │ │
│ │ This is a revolutionary project built on WalGit that...    │ │
│ │                                                             │ │
│ │ ## Features                                                 │ │
│ │ - Decentralized storage                                     │ │
│ │ - End-to-end encryption                                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### File Browser Features
- Breadcrumb navigation with clickable segments
- File type icons and syntax highlighting
- Sortable columns with visual indicators
- Inline README rendering with markdown support

### 6. Code Editor Interface

```
┌─────────────────────────────────────────────────────────────────┐
│ 📄 button.tsx                                          [×]     │
├─────────────────────────────────────────────────────────────────┤
│ src / components / ui / button.tsx                             │
│                                                                 │
│ [📝 Edit] [📋 Copy] [📥 Download] [🔗 Share] [📖 History]      │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  1  import React from 'react'                              │ │
│ │  2  import { cn } from '@/lib/utils'                       │ │
│ │  3                                                          │ │
│ │  4  interface ButtonProps {                                │ │
│ │  5    children: React.ReactNode                            │ │
│ │  6    variant?: 'primary' | 'secondary' | 'ghost'         │ │
│ │  7    size?: 'sm' | 'md' | 'lg'                           │ │
│ │  8    disabled?: boolean                                   │ │
│ │  9    onClick?: () => void                                 │ │
│ │ 10  }                                                       │ │
│ │ 11                                                          │ │
│ │ 12  export const Button: React.FC<ButtonProps> = ({        │ │
│ │ 13    children,                                             │ │
│ │ 14    variant = 'primary',                                 │ │
│ │ 15    size = 'md',                                         │ │
│ │ 16    disabled = false,                                    │ │
│ │ 17    onClick                                              │ │
│ │ 18  }) => {                                                │ │
│ │ 19    return (                                             │ │
│ │ 20      <button                                            │ │
│ │ 21        className={cn(                                   │ │
│ │ 22          'rounded-md font-medium transition-colors',    │ │
│ │ 23          {                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [💾 Save Changes] [↩️ Discard] [👁️ Preview]                    │
└─────────────────────────────────────────────────────────────────┘
```

#### Editor Features
- Syntax highlighting for 50+ languages
- Line numbers with git blame integration
- Auto-save with conflict detection
- Collaborative editing indicators

### 7. Commit Interface

```
┌─────────────────────────────────────────────────────────────────┐
│                        Commit Changes                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Changes to commit (3 files)                                    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ☑️ 📄 src/components/ui/button.tsx        [M] +12 -3      │ │
│ │ ☑️ 📄 src/components/ui/card.tsx          [M] +5 -1       │ │
│ │ ☑️ 📄 src/styles/globals.css              [A] +45 -0      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Commit Message *                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Add cyberpunk button variants and global styles            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Description (optional)                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ - Added primary, secondary, and ghost button variants      │ │
│ │ - Implemented cyberpunk color scheme                       │ │
│ │ - Updated global CSS with new design tokens                │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Advanced Options                                               │
│ ☐ Sign commit with GPG                                        │
│ ☐ Create pull request                                         │
│ ☑️ Push to remote after commit                                │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔒 This commit will be encrypted using your SEAL policy   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                [Cancel]           [💾 Commit Changes]          │
└─────────────────────────────────────────────────────────────────┘
```

#### Commit Features
- File staging with individual selection
- Diff preview on hover
- Commit message templates
- Encryption status indicator

### 8. Pull Request Interface

```
┌─────────────────────────────────────────────────────────────────┐
│ Pull Request #42: Add cyberpunk theme support           [Open] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ alice wants to merge 12 commits into main from feature/theme   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ This PR adds comprehensive cyberpunk theme support         │ │
│ │ including new color schemes, animations, and components.   │ │
│ │                                                             │ │
│ │ ## Changes                                                  │ │
│ │ - New theme system with CSS variables                      │ │
│ │ - Animated backgrounds and effects                         │ │
│ │ - Updated all UI components                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [💬 Conversation] [📁 Files] [✅ Checks] [📊 Insights]         │
│                                                                 │
│ Reviews                                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👤 bob.eth ✅ Approved • 2 hours ago                       │ │
│ │ "Looks great! Love the new animations."                    │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 👤 charlie.eth 📝 Changes requested • 1 hour ago          │ │
│ │ "Please add dark mode toggle to settings"                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Checks                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✅ Tests (12/12 passed)                                    │ │
│ │ ✅ Build (successful)                                      │ │
│ │ ✅ Security scan (no issues)                              │ │
│ │ ⏳ Performance test (running...)                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [🔀 Merge Pull Request]           │
└─────────────────────────────────────────────────────────────────┘
```

#### PR Features
- Real-time collaboration indicators
- Automated checks integration
- Review request system
- Merge conflict resolution UI

### 9. Settings & Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ Repository Settings                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [General] [Collaborators] [Encryption] [Storage] [Advanced]    │
│                                                                 │
│ General Settings                                                │
│                                                                 │
│ Repository Name                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ my-awesome-project                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Description                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ An awesome project built with WalGit                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Visibility                                                      │
│ ◉ Public    ○ Private                                          │
│                                                                 │
│ Default Branch                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ main                                              [▼]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Features                                                        │
│ ☑️ Issues                                                      │
│ ☑️ Pull Requests                                               │
│ ☑️ Actions (CI/CD)                                             │
│ ☐ Wiki                                                        │
│                                                                 │
│ Danger Zone                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [🗑️ Delete Repository]                                     │ │
│ │ This action cannot be undone                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [💾 Save Changes]                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Settings Features
- Tab-based navigation for different settings
- Real-time validation and feedback
- Danger zone with confirmation dialogs
- Role-based access control for settings

## Design Specifications

### Component Architecture

#### Button Variants
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(45deg, #00D4FF, #8A2BE2);
  border: 2px solid transparent;
  color: #0A0A0F;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 30px rgba(0, 212, 255, 0.5);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  border: 2px solid #00D4FF;
  color: #00D4FF;
}

.btn-secondary:hover {
  background: rgba(0, 212, 255, 0.1);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}
```

#### Card Components
```css
.card {
  background: rgba(45, 45, 68, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(0, 212, 255, 0.5);
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(0, 212, 255, 0.2);
}
```

#### Input Fields
```css
.input {
  background: rgba(26, 26, 46, 0.8);
  border: 2px solid rgba(136, 136, 153, 0.3);
  border-radius: 8px;
  color: #C0C0C0;
  font-family: 'JetBrains Mono', monospace;
}

.input:focus {
  border-color: #00D4FF;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
  outline: none;
}
```

### Animation Specifications

#### Page Transitions
```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.page-enter {
  animation: slideInRight 0.3s ease-out;
}
```

#### Loading States
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading {
  animation: pulse 2s infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

#### Hover Effects
```css
.hover-glow {
  transition: all 0.3s ease;
}

.hover-glow:hover {
  filter: drop-shadow(0 0 10px currentColor);
}
```

### Responsive Design

#### Mobile Adaptations
- Navigation collapses to hamburger menu
- Repository cards stack vertically
- Touch-optimized button sizes (minimum 44px)
- Swipe gestures for navigation

#### Tablet Adaptations
- Two-column layout for repository list
- Collapsible sidebar for settings
- Touch and mouse hybrid interactions

#### Desktop Enhancements
- Multi-panel layouts
- Keyboard shortcuts overlay
- Advanced hover states
- Context menus

### Accessibility Standards

#### WCAG 2.1 AA Compliance
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- All interactive elements keyboard accessible
- Screen reader compatible markup
- Focus indicators visible at 2px minimum

#### Keyboard Navigation
- Tab order follows logical flow
- Escape key closes modals/dropdowns
- Arrow keys navigate within components
- Enter/Space activate buttons

#### Screen Reader Support
- Semantic HTML structure
- ARIA labels for complex interactions
- Live regions for dynamic content
- Descriptive link text

## Implementation Guidelines

### CSS Architecture
- Use CSS custom properties for theming
- BEM methodology for class naming
- Mobile-first responsive approach
- Component-scoped styles with CSS modules

### JavaScript Interactions
- Progressive enhancement approach
- Smooth animations with `requestAnimationFrame`
- Debounced input handling
- Intersection Observer for lazy loading

### Performance Considerations
- Critical CSS inlined
- Non-critical assets lazy loaded
- Image optimization with WebP
- Tree-shaking for unused styles

This specification provides a comprehensive foundation for implementing the WalGit user interface while maintaining consistency, accessibility, and performance standards.