# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Use Aider for Code Edits

For all code editing tasks, use Aider (an AI coding assistant):
- Run Aider: `aider --openai-api-base https://openrouter.ai/api/v1 --openai-api-key "$OPENROUTER_API_KEY" --cache-prompts --cache-keepalive-pings 4 --no-stream --model google/gemini-2.5-flash-preview`
- Treat Aider as a junior engineer - provide clear, specific instructions
- Aider will make the necessary changes to the codebase

## Project Architecture

WalGit is a decentralized version control system with three main components:

1. **WalGit Client (Backend)**: JavaScript/Node.js CLI tool that interacts with Sui blockchain and Walrus storage
2. **Smart Contracts**: Sui Move contracts that manage repository structure (commits, trees, references)
3. **Frontend**: React-TypeScript application for browser-based interaction

## Commands

### Frontend (WalGit-Frontend)
- **Build**: `npm run build` 
- **Lint**: `npm run lint` (checks TS/TSX files)
- **Dev**: `npm run dev` (runs Vite development server)
- **Preview**: `npm run preview` (preview production build locally)

### Backend (WalGit-Backend)
- **Test**: `npm test` (runs Jest tests)
- **Single Test**: `node --experimental-vm-modules node_modules/jest/bin/jest.js WalGit-Backend/tests/specific.test.js`
- **Start CLI**: `npm start` (runs the CLI)

### Smart Contracts (SmartContracts)
- **Compile**: `cd SmartContracts && sui move build`
- **Test**: `cd SmartContracts && sui move test`
- **Publish**: `cd SmartContracts && sui client publish --gas-budget 100000000`

## Code Style Guidelines

- **Backend**: JavaScript (ESM), JSDoc comments
- **Frontend**: TypeScript with React, imports sorted by: UI components > layout > hooks > utilities
- **Smart Contracts**: Move, follows [Sui Move Conventions](https://docs.sui.io/concepts/sui-move-concepts/conventions) 
- **Error Handling**: Try/catch with specific error messages (Backend), type handling with optional chaining (Frontend)
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Component Structure**: UI components reuse shadcn/ui-based primitives in `src/components/ui`
- **Formatting**: ESLint for TS/JS files, all imports should use absolute paths from tsconfig
- **Types**: Explicit TypeScript interfaces for props, avoid `any`

## Key Files and Modules

### Smart Contracts
- `walgit.move`: Main entry point for interacting with Git repositories
- `git_repository.move`: Repository structure and management
- `git_commit_object.move`: Commit representation
- `git_tree_object.move`: Directory structure representation
- `git_blob_object.move`: File content representation
- `git_reference.move`: Branch/tag references
- `storage.move`: Storage quota management for Walrus integration

### Backend CLI
- `WalGit-Backend/cli/src/commands/*.js`: Git command implementations
- `WalGit-Backend/cli/src/utils/`: Utilities for authentication, config, and repository operations
- `WalGit-Backend/cli/src/utils/sui-integration.js`: Integration with Sui blockchain

### Frontend
- `WalGit-Frontend/src/pages/`: Main application views
- `WalGit-Frontend/src/components/`: UI components (uses shadcn/ui)
- `WalGit-Frontend/src/hooks/`: React hooks for state management