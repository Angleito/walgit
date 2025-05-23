# WalGit UI Wireframes

This document contains wireframes and design specifications for the improved WalGit UI components.

## Repository Visualization

### Repository Overview Page

```
+------------------------------------------------------------------+
|  HEADER                                                           |
+------------------------------------------------------------------+
|                                                                  |
| [owner/repo] ⭐ Star | 👁️ Watch | 🍴 Fork                     |
|                                                                  |
| +------------------------------------------------------+         |
| | Code | Issues | Pull Requests | Actions | Settings |         |
| +------------------------------------------------------+         |
|                                                                  |
| +------------------+  +----------------------------------+       |
| | 🔄 Branch: main ▼ |  | Go to file | Add file | Clone ▼ |       |
| +------------------+  +----------------------------------+       |
|                                                                  |
| +--------------------------------------+ +-------------------+   |
| |                                      | |                   |   |
| |  Repository Files                    | | Pull Requests     |   |
| |  +-----------------+                 | | +--------------+  |   |
| |  | sources/        |                 | | | PR #1        |  |   |
| |  | tests/          |                 | | | Implement... |  |   |
| |  | Move.toml       |                 | | +--------------+  |   |
| |  | README.md       |                 | |                   |   |
| |  | LICENSE         |                 | | Storage          |   |
| |  +-----------------+                 | | [===========]    |   |
| |                                      | | 512MB of 1GB     |   |
| |  README.md                           | |                   |   |
| |  +----------------------+            | | Tier: Standard    |   |
| |  | # WalGit Core        |            | | Auto-renew: On    |   |
| |  | Core functionality...|            | | Expires in 15 days|   |
| |  +----------------------+            | |                   |   |
| |                                      | |                   |   |
| +--------------------------------------+ +-------------------+   |
|                                                                  |
+------------------------------------------------------------------+
```

### Enhanced Branch Selector

```
+--------------------------------+
| 🔄 Branch: main ▼              |
+--------------------------------+
| +--------------------------+   |
| | 🔍 Find branch or tag... |   |
| +--------------------------+   |
| | [Branches] [Tags]        |   |
| +--------------------------+   |
| | Recent Branches          |   |
| | ○ develop                |   |
| | ○ feature/new-ui         |   |
| +--------------------------+   |
| | All Branches             |   |
| | ✓ main       default     |   |
| |   Latest commit • 2d ago |   |
| |                          |   |
| | ○ develop                |   |
| |   Latest commit • 5d ago |   |
| |                          |   |
| | ○ feature/storage-opt    |   |
| |   Latest commit • 1d ago |   |
| +--------------------------+   |
| | + Create new branch      |   |
| +--------------------------+   |
+--------------------------------+
```

### Repository Graph Visualization

```
+------------------------------------------------------------------+
| [Branch: main ▼]   [Graph | Commits]   [🔍-|○|+]   [⬅️|➡️]        |
+------------------------------------------------------------------+
|                                                  |                |
|     ●─────●─────●                                |  Commit Details|
|     │       \   │                                |                |
|     │        \  │                                |  Update README |
|     │         \ │                                |                |
|     ●          ●                                 |  [main]        |
|     │           │                                |                |
|     │           │                                |  Author: user  |
|     │      [main]                                |  Date: May 8   |
|     ●           │                                |  Hash: a1b2c3  |
|    /│\          │                                |  Parents: 2    |
|   / │ \         │                                |                |
|  ●  ●  ●        ●                                |  Files Changed:|
|  │     │        │                                |  - README.md   |
|  │     │        │                                |  - src/file.js |
|  ●     ●────────●                                |                |
|  │                                               |  [View Files]  |
|  │                                               |  [View Diff]   |
|  ●                                               |                |
|                                                  |  [⬅️ Older]   |
|                                                  |  [Newer ➡️]   |
|                                                  |                |
+------------------------------------------------------------------+
```

### Enhanced Diff View with Syntax Highlighting

```
+------------------------------------------------------------------+
| [FileIcon] src/components/ui/button.tsx          [+5/-2] [⚙️] [▲] |
+------------------------------------------------------------------+
| @@ -15,7 +15,10 @@                                               |
+------------------------------------------------------------------+
| 15 15 | import { cn } from "@/lib/utils";                        |
| 16 16 |                                                          |
| 17 17 | export interface ButtonProps                             |
| 18    |-  extends React.ButtonHTMLAttributes<HTMLButtonElement> {|
|    18 |+  extends React.ButtonHTMLAttributes<HTMLButtonElement>, |
|    19 |+    VariantProps<typeof buttonVariants> {                |
|    20 |+    isLoading?: boolean;                                 |
|    21 |+    leftIcon?: React.ReactNode;                          |
|    22 |+    rightIcon?: React.ReactNode;                         |
| 19 23 |   className?: string;                                    |
| 20 24 | }                                                        |
|                                                                  |
| 💬 Comment: This extends the button with loading state and icons |
| +---------------------------------------------------------+      |
| | UserIcon AngelDev                                 1h ago |      |
| | Good addition! This will make buttons more flexible.     |      |
| +---------------------------------------------------------+      |
|                                                                  |
+------------------------------------------------------------------+
```

## Mode Toggles for Diff View

```
+--------------------------------+
| [⚙️] View options              |
+--------------------------------+
| ○ Enable syntax highlighting   |
| ○ Disable syntax highlighting  |
|                                |
| ○ Unified view                 |
| ○ Split view                   |
|                                |
| ○ Show whitespace changes      |
| ○ Hide whitespace changes      |
|                                |
| [Copy file path]               |
+--------------------------------+
```

## Split View Diff

```
+------------------------------------------------------------------+
| Old                          | New                                |
+------------------------------------------------------------------+
| 15 | import { cn }           | 15 | import { cn }                |
| 16 | from "@/lib/utils";     | 16 | from "@/lib/utils";          |
| 17 |                         | 17 |                              |
| 18 | export interface        | 18 | export interface             |
| 19 | ButtonProps extends     | 19 | ButtonProps extends          |
| 20 | React.ButtonHTMLAttri.. | 20 | React.ButtonHTMLAttri...     |
| 21 | <HTMLButtonElement> {   | 21 | <HTMLButtonElement>,         |
|    |                         | 22 | VariantProps<typeof but...   |
|    |                         | 23 | isLoading?: boolean;         |
|    |                         | 24 | leftIcon?: React.ReactNode;  |
| 22 | className?: string;     | 25 | className?: string;          |
| 23 | }                       | 26 | }                            |
+------------------------------------------------------------------+
```

## Implementation Notes

1. **Repository Visualization**
   - Use SVG for rendering the commit graph
   - Implement zoom and pan for larger repositories
   - Include tooltips for additional commit details
   - Color-code branches, tags, and HEAD references
   - Support expanding/collapsing sections of the graph

2. **Branch Management**
   - Include protection status indicators
   - Show last activity per branch
   - Include recent branches section
   - Support branch creation with visual feedback
   - Show branch relationships in the graph

3. **Diff Visualization**
   - Add syntax highlighting for all supported languages
   - Support both unified and split view modes
   - Add line highlighting and focus features
   - Enable whitespace visibility toggle
   - Support file-level operations (copy path, view raw, download)

4. **General UI Enhancements**
   - Focus on responsive design for mobile and desktop
   - Use animations sparingly for state transitions
   - Ensure keyboard navigation works throughout
   - Support theme switching (light/dark modes)
   - Ensure all components have proper loading states