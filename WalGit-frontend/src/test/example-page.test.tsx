import React from 'react';
import { render, screen, mockNextNavigation, createMockRouteComponentProps } from './next-test-utils';

// Import your component
import RepositoryPage from '../app/repositories/[owner]/[repo]/page';

// Setup mock data
const mockRepo = {
  name: 'test-repo',
  description: 'Test repository',
  owner: 'test-user',
  defaultBranch: 'main',
  stars: 42,
  forks: 10,
};

// Mock repository data fetching
jest.mock('../services/repository', () => ({
  getRepository: jest.fn().mockResolvedValue(mockRepo),
  getRepositoryFiles: jest.fn().mockResolvedValue([
    { path: 'README.md', type: 'file' },
    { path: 'src', type: 'directory' },
  ]),
}));

describe('Repository Page', () => {
  beforeEach(() => {
    // Reset navigation mocks before each test
    mockNextNavigation.resetMocks();
  });

  it('renders repository details with route parameters', async () => {
    // Setup route params as they would be in Next.js App Router
    const props = createMockRouteComponentProps(
      { owner: 'test-user', repo: 'test-repo' },
      '/repositories/test-user/test-repo'
    );
    
    // Render the component with mock route parameters
    render(<RepositoryPage params={props.params} />);
    
    // Wait for component to load data and render
    expect(await screen.findByText('test-repo')).toBeInTheDocument();
    expect(screen.getByText('Test repository')).toBeInTheDocument();
    expect(screen.getByText('test-user')).toBeInTheDocument();
  });

  it('navigates when clicking on file entries', async () => {
    // Setup route params
    const props = createMockRouteComponentProps(
      { owner: 'test-user', repo: 'test-repo' },
      '/repositories/test-user/test-repo'
    );
    
    // Render with route params
    render(<RepositoryPage params={props.params} />);
    
    // Find the README file entry and click it
    const fileLink = await screen.findByText('README.md');
    fileLink.click();
    
    // Verify navigation was called correctly
    expect(mockNextNavigation.push).toHaveBeenCalledWith(
      '/repositories/test-user/test-repo/blob/main/README.md'
    );
  });

  it('shows loading state initially', () => {
    // Setup route params
    const props = createMockRouteComponentProps(
      { owner: 'test-user', repo: 'test-repo' }
    );
    
    // Render with route params
    render(<RepositoryPage params={props.params} />);
    
    // Check for loading indicator
    expect(screen.getByTestId('repository-loading')).toBeInTheDocument();
  });

  it('handles repository not found', async () => {
    // Mock the repository service to return null (not found)
    const repoService = require('../services/repository');
    repoService.getRepository.mockResolvedValueOnce(null);
    
    // Setup route params
    const props = createMockRouteComponentProps(
      { owner: 'non-existent', repo: 'not-found' }
    );
    
    // Render with route params
    render(<RepositoryPage params={props.params} />);
    
    // Check for error message
    expect(await screen.findByText(/repository not found/i)).toBeInTheDocument();
  });
});