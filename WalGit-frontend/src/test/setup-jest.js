// Jest setup file for Next.js tests

// Mock Next.js modules
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} alt={props.alt || ''} />;
  },
}));

jest.mock('next/font/google', () => ({
  Inter: () => ({
    style: {
      fontFamily: 'mocked-inter',
    },
  }),
}));

// Mock next/dynamic to load components synchronously
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn) => {
    const Component = fn();
    Component.displayName = 'DynamicComponent';
    return Component;
  },
}));

// Mock matchMedia 
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Make sure local storage is available
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));