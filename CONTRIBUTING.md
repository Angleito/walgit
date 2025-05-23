# Contributing to WalGit

Welcome to WalGit! We're excited that you're interested in contributing to the future of decentralized version control. This guide will help you get started with contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Testing Guidelines](#testing-guidelines)
7. [Code Style Guidelines](#code-style-guidelines)
8. [Commit Guidelines](#commit-guidelines)
9. [Pull Request Process](#pull-request-process)
10. [Release Process](#release-process)
11. [Community & Communication](#community--communication)

## Code of Conduct

WalGit is committed to fostering a welcoming and inclusive environment for all contributors. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be collaborative**: Work together towards common goals
- **Be inclusive**: Welcome newcomers and diverse perspectives
- **Be constructive**: Provide helpful feedback and solutions
- **Be patient**: Help others learn and grow

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js**: Version 18.0 or higher
- **Git**: Version 2.30 or higher
- **Sui CLI**: Latest version installed
- **Code Editor**: VS Code recommended with suggested extensions
- **Wallet**: Sui-compatible wallet for testing

### Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/walgit.git
   cd walgit
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up development environment**:
   ```bash
   npm run setup:dev
   ```
5. **Run tests** to verify setup:
   ```bash
   npm test
   ```

## Development Environment Setup

### 1. Repository Setup

```bash
# Clone the repository with submodules
git clone --recursive https://github.com/walgit/walgit.git
cd walgit

# If you already cloned, initialize submodules
git submodule update --init --recursive
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend CLI dependencies
cd walgit-backend
npm install

# Install frontend dependencies
cd ../walgit-frontend
npm install

# Return to root
cd ..
```

### 3. Environment Configuration

Create development environment files:

**Root `.env.local`:**
```bash
# Development mode
NODE_ENV=development
WALGIT_DEBUG=true

# Network configuration
SUI_NETWORK=devnet
SUI_RPC=https://fullnode.devnet.sui.io:443

# Storage configuration (optional for local development)
WALRUS_API_KEY=your_walrus_api_key
SEAL_API_KEY=your_seal_api_key
TUSKY_API_KEY=your_tusky_api_key
```

**Frontend `.env.local`:**
```bash
# Next.js configuration
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_WALRUS_API_KEY=your_api_key
NEXT_PUBLIC_SEAL_API_KEY=your_seal_api_key
NEXT_PUBLIC_TUSKY_API_KEY=your_tusky_api_key

# Development flags
NEXT_PUBLIC_ENABLE_MOCK_WALLET=true
NEXT_PUBLIC_DEBUG_MODE=true
```

### 4. Sui Development Setup

```bash
# Install Sui CLI
curl -fsSL https://sui.io/install.sh | bash

# Add to PATH
echo 'export PATH="$HOME/.sui/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
sui --version

# Create development wallet
sui client new-env --alias dev --rpc https://fullnode.devnet.sui.io:443
sui client switch --env dev
sui client new-address ed25519
```

### 5. IDE Configuration

**VS Code Extensions (Recommended):**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-playwright.playwright",
    "move.move-analyzer",
    "ms-vscode.test-adapter-converter"
  ]
}
```

**VS Code Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.associations": {
    "*.move": "move"
  }
}
```

### 6. Development Scripts

**Root Package Scripts:**
```bash
# Development commands
npm run dev              # Start all development servers
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Testing commands
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # End-to-end tests only

# Linting and formatting
npm run lint             # Run ESLint on all code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier

# Build commands
npm run build            # Build all projects
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only
npm run build:contracts  # Build smart contracts
```

## Project Structure

### High-Level Structure

```
walgit/
├── walgit-frontend/           # React/Next.js frontend
├── walgit-backend/            # Node.js CLI backend
├── move/                      # Sui Move smart contracts
├── docs/                      # Documentation
├── tests/                     # E2E tests
├── .github/                   # GitHub workflows
├── scripts/                   # Build and utility scripts
└── README.md
```

### Frontend Structure (`walgit-frontend/`)

```
src/
├── app/                       # Next.js App Router
│   ├── (auth)/               # Auth routes group
│   ├── dashboard/            # Dashboard pages
│   ├── repositories/         # Repository pages
│   ├── settings/             # Settings pages
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── ui/                   # Base UI components
│   ├── forms/                # Form components
│   ├── layout/               # Layout components
│   └── features/             # Feature-specific components
├── hooks/                    # Custom React hooks
├── lib/                      # Utility functions
├── services/                 # API services
├── stores/                   # State management
├── styles/                   # Global styles
└── types/                    # TypeScript definitions
```

### Backend Structure (`walgit-backend/`)

```
cli/
├── bin/                      # Executable scripts
├── src/
│   ├── commands/             # CLI command implementations
│   │   ├── core/             # Core Git commands
│   │   ├── collaboration/    # Collaboration commands
│   │   ├── security/         # Security commands
│   │   └── management/       # Management commands
│   ├── utils/                # Utility modules
│   │   ├── auth.js           # Authentication
│   │   ├── config.js         # Configuration management
│   │   ├── sui-integration.js # Sui blockchain integration
│   │   ├── walrus-integration.js # Walrus storage
│   │   └── seal-encryption.js # SEAL encryption
│   └── index.js              # Main entry point
└── tests/                    # Backend tests
```

### Smart Contracts Structure (`move/`)

```
sources/
├── walgit.move              # Main contract
├── git_repository.move      # Repository management
├── git_commit_object.move   # Commit objects
├── git_tree_object.move     # Tree objects
├── git_blob_object.move     # Blob objects
├── git_reference.move       # References (branches/tags)
├── git_index.move           # Staging area
├── git_merge.move           # Merge operations
├── git_code_review.move     # Code review system
├── git_diff.move            # Diff calculations
└── storage.move             # Storage management
tests/
├── walgit_tests.move        # Basic tests
├── advanced_access_control_tests.move
├── seal_policy_interaction_tests.move
└── state_change_validation_tests.move
```

## Development Workflow

### 1. Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/awesome-new-feature

# 2. Make your changes
# ... edit files ...

# 3. Run tests locally
npm test

# 4. Commit changes
git add .
git commit -m "feat: add awesome new feature"

# 5. Push to your fork
git push origin feature/awesome-new-feature

# 6. Create pull request
```

### 2. Bug Fixes

```bash
# 1. Create bug fix branch
git checkout -b fix/issue-123-wallet-connection

# 2. Reproduce the bug
npm run test:e2e -- --grep "wallet connection"

# 3. Fix the issue
# ... edit files ...

# 4. Verify fix
npm test

# 5. Commit and push
git commit -m "fix: resolve wallet connection timeout"
git push origin fix/issue-123-wallet-connection
```

### 3. Documentation Updates

```bash
# 1. Create docs branch
git checkout -b docs/update-api-reference

# 2. Update documentation
# ... edit markdown files ...

# 3. Verify docs build
npm run docs:build

# 4. Commit and push
git commit -m "docs: update API reference for v2.0"
git push origin docs/update-api-reference
```

## Testing Guidelines

### 1. Test Structure

We use a comprehensive testing strategy with multiple layers:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **Contract Tests**: Test smart contract functionality
- **E2E Tests**: Test complete user workflows

### 2. Writing Tests

**Frontend Component Tests:**
```typescript
// components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Backend Unit Tests:**
```javascript
// cli/src/utils/config.test.js
import { getConfig, setConfig } from './config.js';

describe('Configuration', () => {
  beforeEach(() => {
    // Reset config before each test
    process.env.WALGIT_TEST_MODE = 'true';
  });

  it('should get default configuration', () => {
    const config = getConfig();
    expect(config.sui.network).toBe('testnet');
  });

  it('should set configuration values', () => {
    setConfig('user.name', 'Test User');
    const config = getConfig();
    expect(config.user.name).toBe('Test User');
  });
});
```

**Smart Contract Tests:**
```move
// tests/repository_tests.move
#[test_only]
module walgit::repository_tests {
    use walgit::git_repository;
    use sui::test_scenario;
    
    #[test]
    fun test_create_repository() {
        let mut scenario = test_scenario::begin(@0x1);
        
        // Test repository creation
        git_repository::create_repository(
            string::utf8(b"test-repo"),
            string::utf8(b"Test repository"),
            string::utf8(b"main"),
            &mut storage_quota,
            test_scenario::ctx(&mut scenario)
        );
        
        // Verify repository was created
        test_scenario::next_tx(&mut scenario, @0x1);
        let repo = test_scenario::take_shared<Repository>(&scenario);
        assert!(git_repository::name(&repo) == string::utf8(b"test-repo"), 1);
        
        test_scenario::return_shared(repo);
        test_scenario::end(scenario);
    }
}
```

### 3. Test Commands

```bash
# Run specific test suites
npm run test:frontend          # Frontend tests only
npm run test:backend           # Backend tests only
npm run test:contracts         # Smart contract tests only
npm run test:e2e               # End-to-end tests only

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test files
npm test -- Button.test.tsx
npm test -- config.test.js

# Run tests matching pattern
npm test -- --grep "wallet connection"
```

### 4. Test Requirements

- **All new features** must include unit tests
- **Bug fixes** must include regression tests
- **Public APIs** must have integration tests
- **User-facing features** should have E2E tests
- **Minimum coverage**: 80% for new code

## Code Style Guidelines

### 1. TypeScript/JavaScript

**ESLint Configuration:**
```json
{
  "extends": [
    "@next/next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    "prefer-const": "error",
    "no-unused-vars": "error",
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "error"
  }
}
```

**Naming Conventions:**
- **Variables & Functions**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Types & Interfaces**: `PascalCase`
- **Files**: `kebab-case.ts` or `PascalCase.tsx` for components
- **Directories**: `kebab-case`

**Code Organization:**
```typescript
// 1. External imports
import React from 'react';
import { NextPage } from 'next';

// 2. Internal imports (absolute paths)
import { Button } from '@/components/ui/button';
import { useRepository } from '@/hooks/use-repository';

// 3. Relative imports
import './component.css';

// 4. Type definitions
interface ComponentProps {
  title: string;
  onSubmit: () => void;
}

// 5. Component implementation
export const Component: React.FC<ComponentProps> = ({ title, onSubmit }) => {
  // Component logic
};
```

### 2. React/Next.js

**Component Structure:**
```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick
}) => {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

**Hooks Usage:**
```typescript
// Custom hook example
export function useRepository(id: string) {
  const [repository, setRepository] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchRepository = async () => {
      try {
        setLoading(true);
        const repo = await repositoryService.get(id);
        if (!cancelled) {
          setRepository(repo);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRepository();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { repository, loading, error };
}
```

### 3. Move Smart Contracts

**Naming Conventions:**
- **Modules**: `snake_case`
- **Structs**: `PascalCase`
- **Functions**: `snake_case`
- **Constants**: `SCREAMING_SNAKE_CASE`

**Code Structure:**
```move
module walgit::git_repository {
    use sui::object::{Self, UID, ID};
    use std::string::String;
    
    // Error codes
    const ENotOwner: u64 = 1;
    const EInvalidName: u64 = 2;
    
    // Main struct
    public struct Repository has key, store {
        id: UID,
        name: String,
        owner: address,
        // ... other fields
    }
    
    // Public functions
    public entry fun create_repository(
        name: String,
        description: String,
        ctx: &mut TxContext
    ) {
        // Implementation
    }
    
    // Helper functions
    fun validate_name(name: &String): bool {
        // Validation logic
    }
}
```

### 4. Documentation

**JSDoc Comments:**
```typescript
/**
 * Creates a new repository with the specified configuration.
 * 
 * @param name - The repository name (must be unique)
 * @param description - Optional repository description
 * @param options - Additional repository options
 * @returns Promise that resolves to the created repository
 * 
 * @throws {ValidationError} When repository name is invalid
 * @throws {DuplicateError} When repository name already exists
 * 
 * @example
 * ```typescript
 * const repo = await createRepository('my-repo', 'Description', {
 *   encrypted: true,
 *   visibility: 'private'
 * });
 * ```
 */
export async function createRepository(
  name: string,
  description?: string,
  options: CreateRepositoryOptions = {}
): Promise<Repository> {
  // Implementation
}
```

## Commit Guidelines

### 1. Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 2. Commit Types

- **feat**: New feature for the user
- **fix**: Bug fix for the user
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes
- **ci**: Continuous integration changes

### 3. Examples

```bash
# Feature addition
feat(auth): add wallet connection with retry logic

# Bug fix
fix(storage): resolve quota calculation overflow

# Documentation
docs(api): update repository creation examples

# Breaking change
feat(encryption)!: migrate to SEAL v2.0 API

BREAKING CHANGE: The encryption API has changed from v1 to v2.
Existing encrypted repositories will need to be migrated.
```

### 4. Scope Guidelines

Common scopes include:
- **auth**: Authentication and authorization
- **storage**: Storage operations and management
- **encryption**: Encryption and security features
- **ui**: User interface components
- **cli**: Command-line interface
- **contracts**: Smart contracts
- **api**: API changes
- **docs**: Documentation
- **test**: Testing

## Pull Request Process

### 1. Before Creating PR

- [ ] Code follows style guidelines
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated if needed
- [ ] No merge conflicts with main branch

### 2. PR Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Commented hard-to-understand areas
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### 3. Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: At least one maintainer review required
3. **Testing**: All tests must pass
4. **Documentation**: Updates must be complete
5. **Approval**: Maintainer approval required for merge

### 4. Merge Strategy

- **Squash and Merge**: For feature branches
- **Rebase and Merge**: For clean, atomic commits
- **Merge Commit**: For release branches

## Release Process

### 1. Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### 2. Release Workflow

```bash
# 1. Create release branch
git checkout -b release/v1.2.0

# 2. Update version numbers
npm version 1.2.0

# 3. Update CHANGELOG.md
# ... document changes ...

# 4. Create release PR
# 5. After approval, tag release
git tag v1.2.0
git push origin v1.2.0

# 6. Automated deployment triggers
```

### 3. Release Notes

Each release includes:
- **New Features**: User-facing feature additions
- **Bug Fixes**: Issue resolutions
- **Breaking Changes**: API changes requiring migration
- **Dependencies**: Major dependency updates
- **Migration Guide**: Steps for upgrading

## Community & Communication

### 1. Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time community chat
- **Monthly Calls**: Video calls for contributors

### 2. Getting Help

- **Documentation**: Check docs/ directory first
- **FAQ**: Common questions answered in wiki
- **Issues**: Search existing issues before creating new ones
- **Discord**: Ask in #development channel

### 3. Contributing Types

**Code Contributions:**
- Bug fixes and features
- Performance improvements
- Test coverage improvements
- Documentation updates

**Non-Code Contributions:**
- Bug reports with reproduction steps
- Feature requests with use cases
- Documentation improvements
- Community support and moderation
- Design and UX feedback

### 4. Recognition

Contributors are recognized through:
- **Contributors List**: Maintained in README
- **Release Notes**: Credited in change logs
- **Hall of Fame**: Top contributors highlighted
- **Swag**: Stickers and merchandise for active contributors

## Advanced Development Topics

### 1. Smart Contract Development

**Local Testing:**
```bash
# Compile contracts
cd move
sui move build

# Run contract tests
sui move test

# Deploy to devnet
sui client publish --gas-budget 100000000
```

**Testing with Local Network:**
```bash
# Start local Sui network
sui start --with-faucet

# Get test tokens
sui client faucet

# Deploy and test contracts
sui client publish --gas-budget 100000000
```

### 2. Integration Development

**Wallet Integration Testing:**
```typescript
// Mock wallet for testing
const mockWallet = {
  connect: jest.fn().mockResolvedValue(true),
  getAccounts: jest.fn().mockResolvedValue(['0x123...']),
  signAndExecuteTransactionBlock: jest.fn()
};

// Test wallet operations
test('should connect wallet successfully', async () => {
  const result = await connectWallet(mockWallet);
  expect(result.success).toBe(true);
});
```

**Storage Provider Testing:**
```typescript
// Mock storage for testing
const mockStorage = new MockWalrusClient({
  networkDelay: 100,
  failureRate: 0.1
});

// Test storage operations
test('should upload and retrieve file', async () => {
  const content = Buffer.from('test content');
  const blobId = await mockStorage.writeBlob(content);
  const retrieved = await mockStorage.readBlob(blobId);
  expect(retrieved).toEqual(content);
});
```

### 3. Performance Optimization

**Bundle Analysis:**
```bash
# Analyze frontend bundle
cd walgit-frontend
npm run build
npm run analyze

# Check CLI startup time
cd walgit-backend
time node cli/bin/walgit.js --version
```

**Memory Profiling:**
```bash
# Profile Node.js CLI
node --inspect cli/bin/walgit.js command

# Profile with clinic.js
npx clinic doctor -- node cli/bin/walgit.js command
```

## Troubleshooting Development Issues

### 1. Common Setup Issues

**Node.js Version Issues:**
```bash
# Use nvm to manage Node.js versions
nvm install 18
nvm use 18
node --version  # Should be v18.x.x
```

**Dependency Issues:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

**Sui CLI Issues:**
```bash
# Reinstall Sui CLI
curl -fsSL https://sui.io/install.sh | bash

# Reset Sui client config
sui client new-env --alias dev --rpc https://fullnode.devnet.sui.io:443
sui client switch --env dev
```

### 2. Test Failures

**Frontend Test Issues:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Run specific test with debug
npm test -- --testNamePattern="Button" --verbose
```

**Contract Test Issues:**
```bash
# Rebuild contracts
cd move
sui move clean
sui move build
sui move test --verbose
```

### 3. Build Issues

**Frontend Build Failures:**
```bash
# Check TypeScript errors
cd walgit-frontend
npx tsc --noEmit

# Clear Next.js cache
rm -rf .next
npm run build
```

**CLI Package Issues:**
```bash
# Rebuild CLI
cd walgit-backend
npm run clean
npm run build
npm link
```

---

Thank you for contributing to WalGit! Your contributions help build the future of decentralized version control. If you have any questions not covered in this guide, please don't hesitate to reach out to the community or maintainers.