# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Editing Guidelines

When editing code in this repository:
- Follow the established project architecture and code style guidelines
- Maintain type safety and error handling patterns
- Ensure all code passes linting and tests before submission

## Continuous Operation Mode

- Continue processing tasks without stopping unless explicitly directed
- Complete all assigned tasks in sequence
- Maintain focus on the current task until completion
- Provide progress updates at regular intervals
- When encountering consistent errors, or when user input is highly suggestive, stop and ask for clarification or help from the user, be detailed when asking for assistance.

## Project Completion

The WalGit project has been thoroughly analyzed, improved, and enhanced through a systematic approach:

1. Analysis:
   - Reviewed project structure and identified duplicated files and configurations
   - Analyzed frontend component architecture and state management
   - Evaluated backend CLI implementation for completeness and robustness
   - Verified smart contract code quality and structure

2. Implementation:
   - Cleaned up project structure by removing duplicates and standardizing configurations
   - Completed the Next.js App Router migration
   - Enhanced frontend components, state management, and testing
   - Improved blockchain integration and storage optimization
   - Enhanced smart contract implementations and documentation
   - Created comprehensive documentation for all aspects of the project

3. Configuration Notes:
   - Next.js configuration must use `next.config.js` with JSDoc type annotations
   - TypeScript configuration files (`next.config.ts`) are not supported by Next.js
   - Use the following pattern for type-safe configuration:
     ```js
     // @ts-check
     /** @type {import('next').NextConfig} */
     const nextConfig = { /* config options */ };
     module.exports = nextConfig;
     ```

3. Key Achievements:
   - Advanced merge implementation with conflict detection and resolution
   - Optimized blob storage with three-tiered approach
   - Unified provider architecture for state management
   - Comprehensive testing infrastructure for Next.js components
   - Improved mobile experience and accessibility
   - Enhanced guided tour implementation and quick-start templates
   - Comprehensive documentation for users, developers, and contributors

## Project Architecture

WalGit is a decentralized version control system with three main components:

1. **WalGit Client (Backend)**: JavaScript/Node.js CLI tool that interacts with Sui blockchain and Walrus storage
   - Core Git operations (add, commit, push, pull)
   - Blockchain transaction management
   - Optimized blob storage and retrieval
   - Credential management and security
   - Batch operations and parallel processing

2. **Smart Contracts**: Sui Move contracts that manage repository structure (commits, trees, references)
   - Git data model (repositories, commits, trees, blobs)
   - Storage quota management
   - Merge strategies including conflict resolution
   - Code review and pull request management
   - Reference tracking and garbage collection

3. **Frontend**: React-TypeScript application with Next.js for browser-based interaction
   - Repository management with intuitive UI
   - Code browsing and editing
   - Visualization for commits, branches, and diffs
   - Pull request and code review workflows
   - Guided tours and onboarding experiences

## Commands

### Frontend (walgit-frontend)
- **Build**: `npm run build`
- **Lint**: `npm run lint` (checks TS/TSX files)
- **Start**: `npm start` (starts Next.js production server)
- **Access Dev Server**: Visit `http://localhost:3000` to view the running development server
- **Design Guide**: Follow the cyberpunk styling shown at [https://angleito.github.io/walgit/#why-walgit](https://angleito.github.io/walgit/#why-walgit)

### Backend (walgit-backend)
- **Test**: `npm test` (runs Jest tests)
- **Single Test**: `node --experimental-vm-modules node_modules/jest/bin/jest.js walgit-backend/tests/specific.test.js`
- **Start CLI**: `npm start` (runs the CLI)

### Smart Contracts (move)
- **Compile**: `cd move && sui move build`
- **Test**: `cd move && sui move test`
- **Publish**: `cd move && sui client publish --gas-budget 100000000`

## Code Style Guidelines

- **Backend**: JavaScript (ESM), JSDoc comments
- **Frontend**: TypeScript with React, imports sorted by: UI components > layout > hooks > utilities
- **Smart Contracts**: Move, follows [Sui Move Conventions](https://docs.sui.io/concepts/sui-move-concepts/conventions) 
- **Error Handling**: Try/catch with specific error messages (Backend), type handling with optional chaining (Frontend)
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Component Structure**: UI components reuse shadcn/ui-based primitives in `src/components/ui`
- **Formatting**: ESLint for TS/JS files, all imports should use absolute paths from tsconfig
- **Types**: Explicit TypeScript interfaces for props, avoid `any`
- **Commit Messages**: Create clear, concise commit messages that follow standard conventions (feat:, fix:, docs:, etc). Do NOT include the Claude Code robot emoji or co-authored tag in commit messages

## Key Files and Modules

### Smart Contracts
- `walgit.move`: Main entry point for interacting with Git repositories
- `git_repository.move`: Repository structure and management
- `git_commit_object.move`: Commit representation
- `git_tree_object.move`: Directory structure representation
- `git_blob_object.move`: File content representation with optimized storage
- `git_reference.move`: Branch/tag references
- `storage.move`: Storage quota management for Walrus integration
- `git_merge.move`: Merge strategies with conflict detection and resolution
- `git_code_review.move`: Code review functionality for pull requests
- `git_diff.move`: File difference calculation for comparisons
- `git_index.move`: Staging area for changes before commit

### Backend CLI
- `walgit-backend/cli/src/commands/*.js`: Git command implementations
- `walgit-backend/cli/src/utils/`: Utilities for authentication, config, and repository operations
- `walgit-backend/cli/src/utils/sui-integration.js`: Integration with Sui blockchain
- `walgit-backend/cli/src/utils/transaction-utils.js`: Transaction management with retry mechanisms
- `walgit-backend/cli/src/utils/blob-manager.js`: Optimized blob storage and retrieval
- `walgit-backend/cli/src/utils/credential-manager.js`: Secure credential management
- `walgit-backend/cli/src/utils/parallel-operations.js`: Parallel processing for performance
- `walgit-backend/cli/src/utils/incremental-diff.js`: Efficient diff calculation
- `walgit-backend/cli/src/utils/network-batching.js`: Optimized network requests

### Frontend
- `walgit-frontend/src/app/`: Main application routes and pages (Next.js App Router)
- `walgit-frontend/src/components/`: UI components (uses shadcn/ui)
- `walgit-frontend/src/hooks/`: React hooks for state management
- `walgit-frontend/src/services/`: Service layer for API interactions
- `walgit-frontend/src/providers/`: Context providers for state management
- `walgit-frontend/src/lib/`: Utility functions and shared logic

### User Experience Components
- `walgit-frontend/src/components/ui/theme-switcher.tsx`: Theme customization (light/dark mode and accent colors)
- `walgit-frontend/src/components/ui/notification-system.tsx`: Centralized notification management
- `walgit-frontend/src/components/ui/guided-tour.tsx`: Interactive guided tours for user onboarding
- `walgit-frontend/src/components/onboarding/OnboardingFlow.tsx`: Multi-step onboarding process for new users
- `walgit-frontend/src/components/repository/RepositoryWizard.tsx`: Step-by-step repository creation wizard
- `walgit-frontend/src/components/code-review/`: Code review components for pull requests
- `walgit-frontend/src/components/merge/`: Advanced merge UI for conflict resolution

### Documentation
- `docs/architecture.md`: Comprehensive system architecture documentation
- `docs/api.md`: API documentation for backend services
- `docs/project_review.md`: Analysis of the project structure and organization
- `docs/implementation_todos.md`: Structured implementation plan
- `docs/project_completion_report.md`: Summary of project enhancements
- `walgit-frontend/docs/user-guide.md`: End-user documentation for the web UI
- `move/SECURITY-AUDIT.md`: Security audit for smart contracts
- `walgit-backend/CONTRIBUTING.md`: Contribution guidelines
- `walgit-backend/DEVELOPMENT_SETUP.md`: Development environment setup