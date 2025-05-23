# Next.js Testing Utilities

This directory contains utilities for testing Next.js App Router components in the WalGit project.

## Key Files

- `next-test-utils.tsx`: The main testing utility with providers and mocks for Next.js App Router
- `example-page.test.tsx`: Example test for a page component with route parameters
- `example-component.test.tsx`: Example test for components with form interactions

## Features

- Mocks for Next.js App Router APIs (`useRouter`, `useParams`, `usePathname`, `useSearchParams`)
- Testing utilities for route parameters and navigation
- Integration with React Testing Library
- Mock providers for QueryClient and Sui/Wallet providers
- Utility functions for setting up dynamic test scenarios

## Usage

### Basic Component Rendering

```tsx
import { render, screen } from '../test/next-test-utils';
import MyComponent from '../components/MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Testing Pages with Route Parameters

```tsx
import { render, screen, createMockRouteComponentProps } from '../test/next-test-utils';
import RepoPage from '../app/repositories/[owner]/[repo]/page';

test('renders with route params', () => {
  const props = createMockRouteComponentProps(
    { owner: 'user', repo: 'repo-name' },
    '/repositories/user/repo-name'
  );
  
  render(<RepoPage params={props.params} />);
  expect(screen.getByText('repo-name')).toBeInTheDocument();
});
```

### Testing Navigation

```tsx
import { render, screen, mockNextNavigation } from '../test/next-test-utils';
import NavComponent from '../components/NavComponent';

test('navigates to repository page', () => {
  render(<NavComponent />);
  
  const link = screen.getByText('Go to Repo');
  link.click();
  
  expect(mockNextNavigation.push).toHaveBeenCalledWith('/repositories/user/repo');
});
```

### Setting Up Query Parameters

```tsx
import { render, screen } from '../test/next-test-utils';
import FilterComponent from '../components/FilterComponent';

test('renders with query params', () => {
  render(
    <FilterComponent />,
    { 
      searchParams: { filter: 'active', sort: 'name' }
    }
  );
  
  expect(screen.getByText('Active Filter')).toBeInTheDocument();
});
```

## Mocking Services

By default, the test utilities mock the wallet and Sui client services. You can customize these mocks or add your own:

```tsx
// Mock a service in your test file
jest.mock('../services/myService', () => ({
  getData: jest.fn().mockResolvedValue({ 
    items: ['item1', 'item2'] 
  }),
}));

// Then in your test
const myService = require('../services/myService');
myService.getData.mockResolvedValueOnce({ items: ['special-item'] });
```

## Best Practices

1. Reset navigation mocks before each test with `mockNextNavigation.resetMocks()`
2. Use `waitFor` or `findBy*` queries for asynchronous operations
3. Test user interactions with `fireEvent` or `userEvent`
4. Mock API calls and services for consistent test behavior
5. Test error states and edge cases