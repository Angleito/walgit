import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiffViewer } from '../DiffViewer';

const mockDiffs = [
  {
    filename: 'src/app.js',
    status: 'modified' as const,
    additions: 10,
    deletions: 5,
    lines: [
      { type: 'header' as const, content: '@@ -1,3 +1,3 @@' },
      { type: 'context' as const, content: 'function main() {', oldLineNumber: 1, newLineNumber: 1 },
      { type: 'remove' as const, content: '  console.log("old");', oldLineNumber: 2 },
      { type: 'add' as const, content: '  console.log("new");', newLineNumber: 2 },
      { type: 'context' as const, content: '}', oldLineNumber: 3, newLineNumber: 3 },
    ],
  },
  {
    filename: 'src/styles.css',
    status: 'added' as const,
    additions: 20,
    deletions: 0,
    lines: [
      { type: 'add' as const, content: '.container {', newLineNumber: 1 },
      { type: 'add' as const, content: '  display: flex;', newLineNumber: 2 },
      { type: 'add' as const, content: '}', newLineNumber: 3 },
    ],
  },
];

describe('DiffViewer', () => {
  const defaultProps = {
    diffs: mockDiffs,
    viewMode: 'unified' as const,
    onViewModeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders diff viewer with correct stats', () => {
    render(<DiffViewer {...defaultProps} />);
    
    expect(screen.getByText('2 files changed,')).toBeInTheDocument();
    expect(screen.getByText('+30')).toBeInTheDocument();
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('displays all diff files', () => {
    render(<DiffViewer {...defaultProps} />);
    
    expect(screen.getByText('src/app.js')).toBeInTheDocument();
    expect(screen.getByText('src/styles.css')).toBeInTheDocument();
  });

  it('toggles file expansion', async () => {
    const user = userEvent.setup();
    render(<DiffViewer {...defaultProps} />);
    
    const fileHeader = screen.getByRole('button', { name: /Toggle diff for src\/app.js/i });
    
    // Initially expanded
    expect(screen.getByText('console.log("old");')).toBeInTheDocument();
    
    // Collapse
    await user.click(fileHeader);
    expect(screen.queryByText('console.log("old");')).not.toBeInTheDocument();
    
    // Expand again
    await user.click(fileHeader);
    expect(screen.getByText('console.log("old");')).toBeInTheDocument();
  });

  it('changes view mode', async () => {
    const user = userEvent.setup();
    render(<DiffViewer {...defaultProps} />);
    
    const viewModeSelect = screen.getByRole('combobox');
    await user.click(viewModeSelect);
    
    const splitOption = screen.getByText('Split');
    await user.click(splitOption);
    
    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('split');
  });

  describe('Keyboard Navigation', () => {
    it('displays keyboard navigation hint', () => {
      render(<DiffViewer {...defaultProps} />);
      
      expect(screen.getByText('Press j, k, n, or p to start keyboard navigation')).toBeInTheDocument();
    });

    it('activates keyboard navigation on j key press', () => {
      render(<DiffViewer {...defaultProps} />);
      
      fireEvent.keyDown(window, { key: 'j' });
      
      expect(screen.queryByText('Press j, k, n, or p to start keyboard navigation')).not.toBeInTheDocument();
    });

    it('navigates between lines with j/k keys', () => {
      render(<DiffViewer {...defaultProps} />);
      
      // Activate keyboard navigation
      fireEvent.keyDown(window, { key: 'j' });
      
      // Navigate down
      fireEvent.keyDown(window, { key: 'j' });
      fireEvent.keyDown(window, { key: 'j' });
      
      // Navigate up
      fireEvent.keyDown(window, { key: 'k' });
      
      // Check focus indicators (implementation specific)
      const focusedElements = screen.getAllByClassName('ring-2 ring-[#58a6ff]');
      expect(focusedElements.length).toBeGreaterThan(0);
    });

    it('navigates between files with n/p keys', () => {
      render(<DiffViewer {...defaultProps} />);
      
      // Activate keyboard navigation
      fireEvent.keyDown(window, { key: 'n' });
      
      // Navigate to next file
      fireEvent.keyDown(window, { key: 'n' });
      
      // Navigate to previous file
      fireEvent.keyDown(window, { key: 'p' });
      
      // Check file focus
      const focusedCards = screen.getAllByRole('region');
      expect(focusedCards.length).toBe(2);
    });

    it('toggles file expansion with x key', () => {
      render(<DiffViewer {...defaultProps} />);
      
      // Activate keyboard navigation
      fireEvent.keyDown(window, { key: 'x' });
      
      // Initially expanded, should collapse
      expect(screen.queryByText('console.log("old");')).not.toBeInTheDocument();
      
      // Toggle again to expand
      fireEvent.keyDown(window, { key: 'x' });
      expect(screen.getByText('console.log("old");')).toBeInTheDocument();
    });

    it('exits keyboard navigation with Escape key', () => {
      render(<DiffViewer {...defaultProps} />);
      
      // Activate keyboard navigation
      fireEvent.keyDown(window, { key: 'j' });
      expect(screen.queryByText('Press j, k, n, or p to start keyboard navigation')).not.toBeInTheDocument();
      
      // Exit with Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.getByText('Press j, k, n, or p to start keyboard navigation')).toBeInTheDocument();
    });

    it('shows help with ? key', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      render(<DiffViewer {...defaultProps} />);
      
      // Activate keyboard navigation
      fireEvent.keyDown(window, { key: 'j' });
      
      // Show help
      fireEvent.keyDown(window, { key: '?' });
      
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Keyboard Navigation:'));
      alertSpy.mockRestore();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<DiffViewer {...defaultProps} />);
    
    // Check ARIA labels on file regions
    expect(screen.getByRole('region', { name: 'Diff for src/app.js' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Diff for src/styles.css' })).toBeInTheDocument();
    
    // Check expandable buttons
    const expandButtons = screen.getAllByRole('button', { name: /Toggle diff for/ });
    expect(expandButtons).toHaveLength(2);
    
    // Check aria-expanded
    expect(expandButtons[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders diff lines with proper styling', () => {
    render(<DiffViewer {...defaultProps} />);
    
    // Check context lines
    expect(screen.getByText('function main() {')).toBeInTheDocument();
    
    // Check removed lines
    const removedLine = screen.getByText('console.log("old");');
    expect(removedLine.parentElement).toHaveClass('bg-[#3f1f23]');
    
    // Check added lines
    const addedLine = screen.getByText('console.log("new");');
    expect(addedLine.parentElement).toHaveClass('bg-[#1f362d]');
  });
});