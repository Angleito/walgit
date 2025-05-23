# Code Review Checklist

## General
- [ ] Code follows project style guidelines
- [ ] Changes match the intended functionality
- [ ] Complex logic is commented and clear
- [ ] No unnecessary commented-out code
- [ ] No debugging code left in place
- [ ] Documentation is updated
- [ ] Performance considerations are addressed

## Backend (JavaScript)
- [ ] ESM module system is used consistently
- [ ] JSDoc comments are present for functions
- [ ] Error handling is comprehensive and specific
- [ ] Async/await is used for asynchronous operations
- [ ] Destructuring is used where beneficial
- [ ] Functions follow single responsibility principle
- [ ] Variable/function naming is clear and consistent
- [ ] Security considerations are addressed

## Frontend (TypeScript/React)
- [ ] TypeScript interfaces are used for props (no `any` types)
- [ ] Component naming follows PascalCase
- [ ] Variable/function naming follows camelCase
- [ ] Imports are sorted correctly (UI components > layout > hooks > utilities)
- [ ] Absolute import paths are used
- [ ] React hooks are used correctly
- [ ] Components are responsive
- [ ] User experience considerations are addressed
- [ ] Accessibility best practices are followed

## Smart Contracts (Move)
- [ ] Code follows Sui Move conventions
- [ ] Function and module naming is descriptive
- [ ] Public functions are documented
- [ ] Error handling is implemented with proper abort codes
- [ ] Security vulnerabilities are addressed
- [ ] Gas optimization considerations are made
- [ ] Standard library functions are used when available

## Testing
- [ ] New code has appropriate test coverage
- [ ] Tests include happy path and error cases
- [ ] Tests are properly isolated
- [ ] Mocks are used appropriately
- [ ] Test descriptions are clear and specific
- [ ] Edge cases are considered and tested

## Security
- [ ] No sensitive information is exposed
- [ ] User inputs are validated
- [ ] Access controls are implemented where needed
- [ ] No potential injection vulnerabilities
- [ ] Resource handling is secure
- [ ] No hardcoded credentials

## Performance
- [ ] No unnecessary network requests
- [ ] Expensive operations are optimized
- [ ] Proper pagination/batching for large datasets
- [ ] Memory usage is considered
- [ ] No unnecessary re-renders (frontend)
- [ ] Gas optimization for smart contracts

## Final Verification
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] PR template is completely filled out
- [ ] Changes are reviewed in the context of the entire system
- [ ] Feedback from code review is addressed