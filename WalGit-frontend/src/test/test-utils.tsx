// Re-export everything from next-test-utils to maintain compatibility with existing tests
export * from './next-test-utils';

// Legacy TestWrapper component referenced in Header.test.tsx
import React, { ReactNode } from 'react';
import { AppProviders } from './next-test-utils';

export const TestWrapper = ({ children }: { children: ReactNode }) => {
  return <AppProviders>{children}</AppProviders>;
};