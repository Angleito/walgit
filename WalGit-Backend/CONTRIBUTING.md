# Contributing to WalGit

Thank you for your interest in contributing to WalGit! This document provides comprehensive guidelines for contributing to the project.

## Table of Contents

1. [Introduction](#introduction)
2. [Development Environment Setup](#development-environment-setup)
3. [Code Style Guidelines](#code-style-guidelines)
4. [Testing Requirements](#testing-requirements)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Development Workflow](#development-workflow)
8. [Documentation](#documentation)
9. [Code Review Process](#code-review-process)
10. [Community Guidelines](#community-guidelines)

## Introduction

WalGit is a decentralized version control system that combines traditional Git functionality with blockchain technology. The project consists of three main components:

1. **WalGit Client (Backend)**: JavaScript/Node.js CLI tool that interacts with Sui blockchain and Walrus storage
2. **Smart Contracts**: Sui Move contracts that manage repository structure (commits, trees, references)
3. **Frontend**: React-TypeScript application for browser-based interaction

## Development Environment Setup

### Prerequisites

- **Node.js**: v18 or higher
  ```bash
  # Check Node.js version
  node --version
  ```

- **Git**: Latest version
  ```bash
  # Check Git version
  git --version
  ```

- **Sui CLI**: For smart contract development
  ```bash
  # Install Sui CLI (if not installed)
  cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
  
  # Check Sui version
  sui --version
  ```

- **IDE**: Visual Studio Code (recommended) with extensions for:
  - JavaScript/TypeScript
  - Move (Sui Move)
  - ESLint

### Setting Up the Project

1. **Fork and Clone the Repository**
   ```bash
   # Clone the repository with submodules
   git clone https://github.com/YOUR-USERNAME/walgit.git --recursive
   cd walgit
   
   # Install root dependencies
   npm install
   ```

2. **Backend Setup**
   ```bash
   # Navigate to the backend directory
   cd walgit-backend
   
   # Install dependencies
   npm install
   
   # Make the CLI executable
   npm run pretest
   
   # Link for global development use (optional)
   npm link
   ```

3. **Frontend Setup**
   ```bash
   # Navigate to the frontend directory
   cd walgit-frontend
   
   # Install dependencies
   npm install
   ```

4. **Create Backend Configuration**
   ```bash
   # Create the config directory if it doesn't exist
   mkdir -p ~/.config/walgit-cli
   
   # Create a basic configuration file
   cat > ~/.config/walgit-cli/config.json << EOF
   {
     "network": "devnet",
     "walrusEndpoint": "https://api.walrus.storage/v1",
     "suiRpcUrl": "https://fullnode.devnet.sui.io:443",
     "simulationEnabled": true
   }
   EOF
   ```

5. **Create Frontend Configuration**
   ```bash
   # Create environment configuration
   cat > walgit-frontend/.env.local << EOF
   NEXT_PUBLIC_NETWORK=devnet
   NEXT_PUBLIC_WALRUS_API_KEY=your_walrus_api_key
   NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.devnet.sui.io:443
   EOF
   ```

6. **Build Smart Contracts**
   ```bash
   # Navigate to the smart contracts directory
   cd move
   
   # Build the Move package
   sui move build
   
   # Run the Move tests
   sui move test
   ```

For more detailed setup instructions, please refer to the [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md) file.

## Code Style Guidelines

### General Guidelines

- Use descriptive variable and function names
- Write clear comments for complex logic
- Keep functions small and focused
- Follow the Single Responsibility Principle
- Use consistent indentation and formatting
- Avoid commented out code

### Backend (JavaScript)

- Use ECMAScript modules (ESM)
- Include JSDoc comments for all functions
- Follow camelCase for variables and functions
- Implement proper error handling with try/catch blocks and specific error messages
- Use async/await for asynchronous operations
- Organize files by functionality
- Use destructuring for cleaner code

Example:
```javascript
/**
 * Fetches repository information from the blockchain
 * @param {string} repoId - The repository ID
 * @returns {Promise<Object>} Repository information
 * @throws {Error} If repository doesn't exist
 */
export async function getRepositoryInfo(repoId) {
  try {
    const { data } = await suiClient.getObject({ id: repoId });
    return data.content;
  } catch (error) {
    throw new Error(`Failed to fetch repository: ${error.message}`);
  }
}
```

### Frontend (TypeScript/React)

- Use TypeScript interfaces for props, avoid using `any`
- Follow PascalCase for components and interfaces
- Follow camelCase for variables, functions, and instances
- Sort imports by: UI components > layout > hooks > utilities
- Use absolute paths from tsconfig for imports
- Create reusable components
- Use React hooks for state management
- Implement responsive design

Example:
```tsx
interface RepositoryCardProps {
  name: string;
  description: string;
  owner: string;
  stars: number;
  onSelect: (repo: string) => void;
}

export function RepositoryCard({ name, description, owner, stars, onSelect }: RepositoryCardProps) {
  return (
    <div className="card" onClick={() => onSelect(name)}>
      <h3>{name}</h3>
      <p>{description}</p>
      <div className="meta">
        <span>Owner: {owner}</span>
        <span>Stars: {stars}</span>
      </div>
    </div>
  );
}
```

### Smart Contracts (Move)

- Follow [Sui Move Conventions](https://docs.sui.io/concepts/sui-move-concepts/conventions)
- Use clear, descriptive names for modules and functions
- Document public functions with comments
- Ensure proper error handling with abort codes
- Implement comprehensive tests for all functionality
- Use standard library functions when available
- Follow consistent naming conventions

Example:
```move
module walgit::git_repository {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    
    /// Error codes
    const E_UNAUTHORIZED: u64 = 1;
    const E_INVALID_NAME: u64 = 2;
    
    /// Repository object
    struct Repository has key, store {
        id: UID,
        name: String,
        description: String,
        owner: address,
        head_commit: Option<ID>
    }
    
    /// Creates a new repository
    public fun create_repository(
        name: String,
        description: String,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        let repository = Repository {
            id: object::new(ctx),
            name,
            description,
            owner,
            head_commit: option::none()
        };
        
        transfer::share_object(repository);
    }
}
```

## Testing Requirements

Testing is a crucial part of contributing to WalGit. All new features and bug fixes should include appropriate tests.

### Backend Testing

- Write Jest tests for all new functionality
- Ensure test coverage for:
  - Happy path scenarios
  - Error handling cases
  - Edge cases
- Run tests with:
  ```bash
  cd walgit-backend
  npm test
  ```
- To run a specific test:
  ```bash
  node --experimental-vm-modules node_modules/jest/bin/jest.js walgit-backend/tests/specific.test.js
  ```
- Use mocks for external dependencies (blockchain, storage)

Example test:
```javascript
import { getRepositoryInfo } from '../src/utils/repository.js';
import { suiClient } from '../src/utils/sui-integration.js';

jest.mock('../src/utils/sui-integration.js');

describe('Repository Utilities', () => {
  test('getRepositoryInfo should return repository data', async () => {
    // Mock implementation
    suiClient.getObject.mockResolvedValue({
      data: {
        content: {
          name: 'test-repo',
          description: 'Test repository',
          owner: '0x123'
        }
      }
    });
    
    const result = await getRepositoryInfo('repo-id');
    expect(result).toEqual({
      name: 'test-repo',
      description: 'Test repository',
      owner: '0x123'
    });
    expect(suiClient.getObject).toHaveBeenCalledWith({ id: 'repo-id' });
  });
});
```

### Frontend Testing

- Write tests for React components using Jest and React Testing Library
- Test component rendering, user interactions, and state changes
- Create unit tests for utility functions
- Use mock data for API calls
- Run tests with:
  ```bash
  cd walgit-frontend
  npm test
  ```
- Use snapshot testing for UI components

Example:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { RepositoryCard } from './RepositoryCard';

describe('RepositoryCard', () => {
  const mockOnSelect = jest.fn();
  
  test('renders repository information correctly', () => {
    render(
      <RepositoryCard
        name="test-repo"
        description="Test repository"
        owner="user123"
        stars={42}
        onSelect={mockOnSelect}
      />
    );
    
    expect(screen.getByText('test-repo')).toBeInTheDocument();
    expect(screen.getByText('Test repository')).toBeInTheDocument();
    expect(screen.getByText('Owner: user123')).toBeInTheDocument();
    expect(screen.getByText('Stars: 42')).toBeInTheDocument();
  });
  
  test('calls onSelect when clicked', () => {
    render(
      <RepositoryCard
        name="test-repo"
        description="Test repository"
        owner="user123"
        stars={42}
        onSelect={mockOnSelect}
      />
    );
    
    fireEvent.click(screen.getByText('test-repo'));
    expect(mockOnSelect).toHaveBeenCalledWith('test-repo');
  });
});
```

### Smart Contract Testing

- Write Move tests for all smart contract functionality
- Test all possible execution paths
- Include both positive cases and error cases
- Run tests with:
  ```bash
  cd move
  sui move test
  ```
- Consider integration tests with the client

Example:
```move
#[test]
fun test_create_repository() {
    let scenario = test_scenario::begin(@0x1);
    {
        let ctx = test_scenario::ctx(&mut scenario);
        create_repository(string::utf8(b"test-repo"), string::utf8(b"Test repo"), ctx);
    };
    
    test_scenario::next_tx(&mut scenario, @0x1);
    {
        let repository = test_scenario::take_shared<Repository>(&scenario);
        assert!(repository.name == string::utf8(b"test-repo"), 0);
        assert!(repository.owner == @0x1, 0);
        test_scenario::return_shared(repository);
    };
    
    test_scenario::end(scenario);
}
```

## Commit Guidelines

- Use clear, descriptive commit messages
- Include references to issues or tasks when applicable
- Keep commits focused on a single change
- Format: `type(scope): description` (e.g., `feat(cli): add support for storage command`)

Types:
- `feat` - A new feature
- `fix` - A bug fix
- `docs` - Documentation changes
- `style` - Formatting, missing semi-colons, etc; no code change
- `refactor` - Refactoring code
- `test` - Adding or refactoring tests; no production code change
- `chore` - Updating build tasks, package manager configs, etc; no production code change

Examples:
- `feat(cli): implement code review commands`
- `fix(frontend): resolve wallet connection issue`
- `docs(api): update authentication documentation`
- `test(smart-contracts): add tests for merge operations`

## Pull Request Process

1. **Branching Strategy**
   - Create feature branches from `main`
   - Use descriptive branch names prefixed with type: `feat/storage-quota-management`
   - Keep branches focused on a single feature or fix

2. **Before Submitting a PR**
   - Ensure all tests pass locally
   - Update documentation for any changed functionality
   - Run linters to ensure code style compliance
   - Resolve any merge conflicts with the target branch

3. **Creating a PR**
   - Fill out the PR template completely
   - Link to any related issues
   - Add clear descriptions of the changes
   - Include screenshots for UI changes
   - Request review from relevant team members

4. **PR Requirements**
   - All continuous integration checks must pass
   - Code must meet style guidelines
   - New features must include tests
   - Documentation must be updated
   - No merge conflicts with the target branch

5. **Review Process**
   - Address all review comments
   - Update the PR with requested changes
   - Request re-review after addressing feedback
   - Maintain a respectful and collaborative tone

6. **Merging**
   - PRs will be merged by maintainers after approval
   - PRs should be squashed when merging unless multiple commits are meaningful
   - Ensure the PR title and description are clear for the squash commit message

## Development Workflow

### Backend Development

```bash
# Start the CLI
cd walgit-backend
npm start

# Run tests
npm test

# Debug with Node inspector
node --inspect-brk bin/walgit.js <command>
```

### Frontend Development

```bash
# Start development server
cd walgit-frontend
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

### Smart Contract Development

```bash
# Compile contracts
cd move
sui move build

# Run tests
sui move test

# Publish contracts
sui client publish --gas-budget 100000000

# Generate documentation
sui move document --output md --output-directory docs
```

## Documentation

Documentation is a vital part of the project. When contributing, please update relevant documentation:

- **Code Documentation**
  - Add JSDoc comments to JavaScript/TypeScript functions
  - Document Move module and function purposes
  - Keep comments up to date with code changes

- **User Documentation**
  - Update README.md for significant changes
  - Document new CLI commands or features
  - Create usage examples for new functionality

- **Architecture Documentation**
  - Update in the `/docs` directory
  - Maintain diagrams and flow charts
  - Document component interactions

## Code Review Process

All submissions require review before being merged. The review process ensures code quality and consistency.

### Reviewer Guidelines

- Check for adherence to style guidelines
- Verify functionality works as intended
- Ensure proper test coverage
- Look for potential performance issues
- Verify documentation is updated

### Author Responsibilities

- Be responsive to feedback
- Explain design decisions
- Address all review comments
- Update code based on feedback
- Mark resolved comments

## Community Guidelines

We strive to maintain a welcoming and inclusive community. All contributors are expected to:

- Be respectful and considerate in communications
- Focus on the issue, not the person
- Accept constructive criticism gracefully
- Help others when possible
- Follow the code of conduct

### Getting Help

If you have questions or need help with the contribution process, please:

1. Check existing issues and documentation
2. Open a new issue with your question
3. Reach out to project maintainers

Thank you for contributing to WalGit!