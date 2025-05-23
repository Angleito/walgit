import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock imports of CSS/styles that aren't relevant for tests
vi.mock('@mysten/dapp-kit/dist/index.css', () => ({}), { virtual: true });

// Mock ResizeObserver which isn't available in jsdom/testing environment but is used by UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia which is used by some UI components
global.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock environment variables
vi.stubGlobal('import.meta', { 
  env: { 
    VITE_WALGIT_PACKAGE_ID: '0xtest123',
    VITE_NETWORK: 'devnet',
    MODE: 'test'
  }
});