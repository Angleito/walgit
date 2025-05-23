import React from 'react';
import { render, screen } from '@testing-library/react';
import { CircuitBackground } from './circuit-background';

describe('CircuitBackground Component', () => {
  it('renders without crashing', () => {
    // We can't test actual rendering of SVG paths since they're random
    // but we can ensure the component renders without errors
    render(<CircuitBackground />);
    
    // The component should be accessible but hidden from screen readers
    const background = document.querySelector('div[aria-hidden="true"]');
    expect(background).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<CircuitBackground className="custom-class" />);
    const background = document.querySelector('div[aria-hidden="true"]');
    expect(background).toHaveClass('custom-class');
  });

  it('renders an SVG element', () => {
    render(<CircuitBackground />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has performance optimization attributes', () => {
    render(<CircuitBackground />);
    
    // Component should be pointer-events-none to let interactions pass through
    const container = document.querySelector('div[aria-hidden="true"]');
    expect(container).toHaveClass('pointer-events-none');
    
    // Should have z-index to not interfere with content
    expect(container).toHaveClass('z-0');
    
    // Should be absolutely positioned
    expect(container).toHaveClass('absolute');
  });
});