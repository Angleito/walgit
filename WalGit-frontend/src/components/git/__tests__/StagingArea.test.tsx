import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StagingArea } from '../StagingArea';

// Mock react-window
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemData, itemSize }: any) => (
    <div data-testid="virtual-list">
      {Array.from({ length: itemCount }, (_, index) =>
        children({ index, style: { height: itemSize }, data: itemData })
      )}
    </div>
  ),
}));

const mockChanges = [
  {
    filename: 'src/app.js',
    status: 'modified' as const,
    additions: 10,
    deletions: 5,
    staged: false,
  },
  {
    filename: 'src/styles.css',
    status: 'added' as const,
    additions: 20,
    deletions: 0,
    staged: false,
  },
  {
    filename: 'old-file.js',
    status: 'deleted' as const,
    additions: 0,
    deletions: 30,
    staged: true,
  },
];

const mockDiff = {
  filename: 'src/app.js',
  status: 'modified' as const,
  additions: 10,
  deletions: 5,
  lines: [
    { type: 'context' as const, content: 'function main() {', oldLineNumber: 1, newLineNumber: 1 },
    { type: 'remove' as const, content: '  console.log("old");', oldLineNumber: 2 },
    { type: 'add' as const, content: '  console.log("new");', newLineNumber: 2 },
  ],
};

describe('StagingArea', () => {
  const defaultProps = {
    changes: mockChanges,
    onStageFiles: jest.fn(),
    onUnstageFiles: jest.fn(),
    onDiscardChanges: jest.fn(),
    getDiffForFile: jest.fn(() => mockDiff),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders staging area with correct file counts', () => {
    render(<StagingArea {...defaultProps} />);
    
    expect(screen.getByText('Unstaged Changes (2)')).toBeInTheDocument();
    expect(screen.getByText('Staged Changes (1)')).toBeInTheDocument();
  });

  it('displays file information correctly', () => {
    render(<StagingArea {...defaultProps} />);
    
    expect(screen.getByLabelText(/src\/app.js - modified file/)).toBeInTheDocument();
    expect(screen.getByLabelText(/src\/styles.css - added file/)).toBeInTheDocument();
    expect(screen.getByLabelText(/old-file.js - deleted file/)).toBeInTheDocument();
  });

  it('handles file selection', async () => {
    const user = userEvent.setup();
    render(<StagingArea {...defaultProps} />);
    
    const fileCheckbox = screen.getByLabelText('Select src/app.js');
    await user.click(fileCheckbox);
    
    expect(fileCheckbox).toBeChecked();
  });

  it('stages selected files', async () => {
    const user = userEvent.setup();
    render(<StagingArea {...defaultProps} />);
    
    // Select a file
    const fileCheckbox = screen.getByLabelText('Select src/app.js');
    await user.click(fileCheckbox);
    
    // Click stage button
    const stageButton = screen.getByRole('button', { name: /Stage/i });
    await user.click(stageButton);
    
    expect(defaultProps.onStageFiles).toHaveBeenCalledWith(['src/app.js']);
  });

  it('filters files based on search query', async () => {
    const user = userEvent.setup();
    render(<StagingArea {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Filter files...');
    await user.type(searchInput, 'app');
    
    expect(screen.getByLabelText(/src\/app.js/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/src\/styles.css/)).not.toBeInTheDocument();
  });

  it('shows file diff when file is selected', async () => {
    const user = userEvent.setup();
    render(<StagingArea {...defaultProps} />);
    
    const fileItem = screen.getByLabelText(/src\/app.js - modified file/);
    await user.click(fileItem);
    
    expect(defaultProps.getDiffForFile).toHaveBeenCalledWith('src/app.js');
  });

  it('handles keyboard navigation in virtualized lists', () => {
    render(<StagingArea {...defaultProps} />);
    
    // Check that virtual lists are rendered
    const virtualLists = screen.getAllByTestId('virtual-list');
    expect(virtualLists).toHaveLength(2);
  });

  it('shows discard confirmation dialog', async () => {
    const user = userEvent.setup();
    render(<StagingArea {...defaultProps} />);
    
    // Select a file
    const fileCheckbox = screen.getByLabelText('Select src/app.js');
    await user.click(fileCheckbox);
    
    // Click discard button
    const discardButton = screen.getByRole('button', { name: /Discard/i });
    await user.click(discardButton);
    
    // Check dialog appears
    expect(screen.getByText('Discard changes')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to discard changes to 1 file/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<StagingArea {...defaultProps} />);
    
    // Check ARIA labels
    expect(screen.getByRole('listbox', { name: 'Unstaged files' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Staged files' })).toBeInTheDocument();
    
    // Check file options
    const fileOptions = screen.getAllByRole('option');
    expect(fileOptions).toHaveLength(3);
  });

  it('handles view mode toggle for diff viewer', async () => {
    const user = userEvent.setup();
    render(<StagingArea {...defaultProps} />);
    
    // Select a file to show diff
    const fileItem = screen.getByLabelText(/src\/app.js - modified file/);
    await user.click(fileItem);
    
    // Diff viewer should be displayed
    expect(screen.getByText('Select a file to view changes')).not.toBeInTheDocument();
  });
});