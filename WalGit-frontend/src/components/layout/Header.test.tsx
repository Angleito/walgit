import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { TestWrapper } from '@/test/test-utils';

// Create a mock version of the CyberpunkNavBar component for testing
jest.mock('./CyberpunkNavBar', () => ({
  __esModule: true,
  default: ({ logoComponent, navItems }) => (
    <div data-testid="cyberpunk-navbar">
      <div>{logoComponent}</div>
      <nav>
        {navItems.map((item, i) => (
          <a key={i} href={item.href}>{item.label}</a>
        ))}
      </nav>
    </div>
  )
}));

// Import after mocking
import Header from './Header';

describe('Header', () => {
  it('renders the cyberpunk navbar with correct items', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // Check that the navbar is displayed
    expect(screen.getByTestId('cyberpunk-navbar')).toBeInTheDocument();

    // Check that the logo is displayed
    expect(screen.getByAltText('WalGit Logo')).toBeInTheDocument();
    expect(screen.getByText('WalGit')).toBeInTheDocument();

    // Check that navigation links are displayed
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Why WalGit')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
  });
});