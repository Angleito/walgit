# WalGit Implementation Todos

This document outlines specific, actionable tasks identified from the project review to improve the WalGit codebase. These tasks are organized by category and prioritized by importance.

## Project Structure Cleanup

1. **Remove Duplicate Files**
   - Delete all files with " 2" suffix in the `move/` directory
   - Remove duplicate `sources 2/` and `tests 2/` directories
   - Delete the redundant `/next/` directory with duplicate configuration files

2. **Consolidate Configuration Files**
   - Standardize on TypeScript configuration files (.ts extensions)
   - Remove duplicate .js configuration files (eslint.config.js, tailwind.config.js)
   - Update package.json to reference the standardized configuration files

3. **Normalize Frontend Structure**
   - Remove duplicate app directories (`new-repository 2/`, `profile 2/`, etc.)
   - Complete migration from pages directory to app directory
   - Update import paths to reflect the new structure

## Frontend Improvements

4. **Complete Next.js Migration**
   - Remove legacy pages directory entirely
   - Convert remaining page components to use App Router pattern
   - Update all routes to use dynamic segments consistently

5. **Enhance Component Testing**
   - Add Jest tests for all critical UI components
   - Set up React Testing Library for component testing
   - Create test mocks for Sui blockchain interactions

6. **Consolidate State Management**
   - Merge related context providers where appropriate
   - Create a unified provider architecture
   - Implement proper context memoization for performance

7. **Form Standardization**
   - Implement React Hook Form across all form components
   - Add proper form validation with zod
   - Create reusable form components for common patterns

8. **Accessibility Enhancements**
   - Add proper focus management
   - Ensure all interactive elements have ARIA attributes
   - Implement keyboard navigation across the application

## Backend CLI Enhancements

9. **Implement Missing Commands**
   - Add stash command for temporary changes
   - Implement submodule support
   - Add credential helper system

10. **Enhance Test Coverage**
    - Create unit tests for all CLI commands
    - Add integration tests for command sequences
    - Implement mocks for blockchain and storage integration

11. **Improve Command Documentation**
    - Add detailed examples for each command
    - Create usage guides with common workflows
    - Document command options and flags

12. **Optimize Performance**
    - Implement local caching for repeated operations
    - Add parallel processing for file operations
    - Optimize blockchain transaction grouping

## Smart Contract Improvements

13. **Complete Placeholder Implementations**
    - Finish implementation of `get_staged_entries` in git_index.move
    - Complete other placeholder functions identified
    - Add proper error handling to all functions

14. **Expand Merge Strategies**
    - Implement non-fast-forward merge support
    - Add three-way merge capability
    - Implement conflict resolution

15. **Optimize for Large Repositories**
    - Implement chunking for large blob storage
    - Add reference counting for shared objects
    - Optimize tree traversal for performance

16. **Enhance Test Coverage**
    - Add tests for edge cases in repository operations
    - Create comprehensive tests for merge scenarios
    - Add error handling tests for invalid operations

## Documentation Improvements

17. **Update Technical Documentation**
    - Document the architecture and data flow
    - Create API documentation for backend services
    - Update smart contract interface documentation

18. **Create User Guides**
    - Write end-user documentation for the Web UI
    - Create CLI command reference guide
    - Add examples for common workflows

19. **Improve Developer Documentation**
    - Document the development environment setup
    - Create contribution guidelines
    - Add architectural decision records

## Integration and Security

20. **Improve Blockchain Integration**
    - Enhance transaction error handling
    - Implement more efficient batch operations
    - Add retry mechanisms for failed transactions

21. **Enhance Storage Integration**
    - Optimize blob storage and retrieval
    - Implement more efficient storage quota management
    - Add data integrity verification

22. **Security Enhancements**
    - Add comprehensive input validation
    - Implement rate limiting for API endpoints
    - Add security audit for smart contracts

## Performance Optimization

23. **Frontend Performance**
    - Implement code splitting for all routes
    - Add component-level memoization
    - Optimize bundle size with tree shaking

24. **Backend Performance**
    - Implement parallel processing for file operations
    - Add incremental computation for diff operations
    - Optimize network requests with batching

25. **Smart Contract Performance**
    - Optimize gas usage in critical operations
    - Reduce storage overhead in on-chain structures
    - Implement off-chain computation where possible

## User Experience Enhancements

26. **Improve Onboarding Flow**
    - Enhance guided tour implementation
    - Add contextual help for first-time users
    - Create quick-start templates for repositories

27. **Enhance Repository Management**
    - Improve repository visualization
    - Add more intuitive branch management
    - Enhance diff visualization with syntax highlighting

28. **Optimize Mobile Experience**
    - Improve responsive design for all components
    - Add mobile-specific navigation patterns
    - Optimize touch interactions for key workflows