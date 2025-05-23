import React from 'react';
import { render, screen, fireEvent, waitFor } from './next-test-utils';

// Import your component
import NewRepositoryPage from '../app/new-repository/page';

// Mock required services
jest.mock('../services/wallet', () => ({
  createRepository: jest.fn().mockResolvedValue({
    id: 'mock-repo-id',
    name: 'test-repo',
    owner: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  }),
}));

describe('NewRepository Page', () => {
  it('renders the repository creation form', () => {
    render(<NewRepositoryPage />);
    
    // Check for form elements
    expect(screen.getByLabelText(/repository name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create repository/i })).toBeInTheDocument();
  });
  
  it('submits the form and creates a new repository', async () => {
    const walletService = require('../services/wallet');
    render(<NewRepositoryPage />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/repository name/i), {
      target: { value: 'test-repo' },
    });
    
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'My test repository' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create repository/i }));
    
    // Verify the wallet service was called with the correct data
    await waitFor(() => {
      expect(walletService.createRepository).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-repo',
          description: 'My test repository',
        })
      );
    });
    
    // Verify navigation to the new repository page
    const nextNavigation = require('next/navigation');
    await waitFor(() => {
      expect(nextNavigation.useRouter().push).toHaveBeenCalledWith(
        '/repositories/0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef/test-repo'
      );
    });
  });

  it('shows error messages for invalid inputs', async () => {
    render(<NewRepositoryPage />);
    
    // Submit without filling form
    fireEvent.click(screen.getByRole('button', { name: /create repository/i }));
    
    // Check for validation errors
    expect(await screen.findByText(/repository name is required/i)).toBeInTheDocument();
  });
  
  it('displays error when repository creation fails', async () => {
    // Mock the wallet service to throw an error
    const walletService = require('../services/wallet');
    walletService.createRepository.mockRejectedValueOnce(new Error('Failed to create repository'));
    
    render(<NewRepositoryPage />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/repository name/i), {
      target: { value: 'test-repo' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create repository/i }));
    
    // Check for error message
    expect(await screen.findByText(/failed to create repository/i)).toBeInTheDocument();
  });
});