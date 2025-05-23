# Enhanced Diff Visualization Component

This component enhances the diff visualization in the WalGit frontend with the following features:

## Features

- **Syntax Highlighting**: Code-aware syntax highlighting for dozens of programming languages
- **Side-by-Side and Unified Views**: Toggle between unified and split diff views
- **Collapsible Sections**: Collapse individual hunks or the entire file for easier navigation
- **Word-Level Diffs**: Highlight specific word changes within lines
- **Improved Navigation**: Jump between comments and changes with keyboard shortcuts
- **Whitespace Visualization**: Option to show whitespace characters
- **Line Wrapping**: Toggle between wrapped and scrollable lines
- **Theme Support**: Light and dark themes
- **Context Size Control**: Adjust the number of context lines shown
- **Responsive Design**: Works well on mobile and desktop

## Implementation Notes

1. **Component Structure**:
   - Enhanced from the existing `FileDiff.tsx` component
   - Preserves all existing functionality including comments

2. **Dependencies**:
   - Uses Prism.js for syntax highlighting
   - Leverages shadcn/ui components for consistent UI
   - Minimal external dependencies

3. **Performance Optimizations**:
   - Memoization of processed diffs
   - On-demand syntax highlighting
   - Efficient collapse/expand operations

4. **Keyboard Shortcuts**:
   - `Ctrl/Cmd + n`: Next comment
   - `Ctrl/Cmd + p`: Previous comment
   - `Ctrl/Cmd + u`: Unified view
   - `Ctrl/Cmd + s`: Split view
   - `Ctrl/Cmd + h`: Toggle syntax highlighting
   - `Ctrl/Cmd + c`: Collapse file

## Usage

```tsx
import { EnhancedFileDiff } from '@/components/code-review/EnhancedFileDiff';

// Example usage in a pull request view
<EnhancedFileDiff
  fileInfo={{
    oldPath: 'src/components/Button.tsx',
    newPath: 'src/components/Button.tsx',
    type: 'modified'
  }}
  hunks={diffHunks}
  threads={commentThreads}
  onAddComment={handleAddComment}
  onReplyToThread={handleReplyToThread}
  onResolveThread={handleResolveThread}
  onReopenThread={handleReopenThread}
/>
```

## Requirements

- React 18+
- TailwindCSS
- shadcn/ui components
- Prism.js for syntax highlighting

## Installation

1. Copy the `EnhancedFileDiff.tsx` component to your project
2. Install required dependencies:
   ```bash
   npm install prismjs @types/prismjs
   # or
   yarn add prismjs @types/prismjs
   ```
3. Import additional Prism language support as needed

## Customization

The component is highly customizable with options for:
- Default view mode
- Theme preferences
- Language detection for custom file extensions
- Context size defaults