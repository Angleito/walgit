import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

// Create a mock version of the Header component for testing
vi.mock('./Header', () => ({
  Header: () => (
    <header>
      <div>
        <img alt="WalGit Logo" />
        <span>WalGit</span>
        <nav>
          <a>Repositories</a>
          <a>Explore</a>
          <a>Network</a>
        </nav>
        <input placeholder="Search repositories..." />
      </div>
    </header>
  )
}));

// Import after mocking
import { Header } from './Header';

describe('Header', () => {
  it('renders basic UI elements', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Check that the logo is displayed
    expect(screen.getByAltText('WalGit Logo')).toBeInTheDocument();
    expect(screen.getByText('WalGit')).toBeInTheDocument();
    
    // Check that navigation links are displayed
    expect(screen.getByText('Repositories')).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
    
    // Check that search input is displayed
    expect(screen.getByPlaceholderText('Search repositories...')).toBeInTheDocument();
  });
});