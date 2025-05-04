# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Use Aider for Code Edits

For all code editing tasks, use Aider (an AI coding assistant):
- Run Aider: `aider --openai-api-base https://openrouter.ai/api/v1 --openai-api-key "$OPENROUTER_API_KEY" --cache-prompts --cache-keepalive-pings 4 --no-stream --model google/gemini-2.5-flash-preview`
- Treat Aider as a junior engineer - provide clear, specific instructions
- Aider will make the necessary changes to the codebase

## Commands

- **Build**: `npm run build` (Frontend); Move compilation: CLI to be added
- **Lint**: `npm run lint` (Frontend, checks TS/TSX files)
- **Test**: `npm test` (Backend tests)
- **Single Test**: `node --experimental-vm-modules node_modules/jest/bin/jest.js WalGit-Backend/tests/specific.test.js`
- **Dev**: `npm run dev` (Frontend)

## Code Style Guidelines

- **Backend**: JavaScript (ESM), JSDoc comments
- **Frontend**: TypeScript with React, imports sorted by: UI components > layout > hooks > utilities
- **Smart Contracts**: Move, follows [Sui Move Conventions](https://docs.sui.io/concepts/sui-move-concepts/conventions) 
- **Error Handling**: Try/catch with specific error messages (Backend), type handling with optional chaining (Frontend)
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Component Structure**: UI components reuse shadcn/ui-based primitives in `src/components/ui`
- **Formatting**: ESLint for TS/JS files, all imports should use absolute paths from tsconfig
- **Types**: Explicit TypeScript interfaces for props, avoid `any`