import React from "react";

/**
 * Skip link component for keyboard users to skip to main content
 */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-background focus:border focus:border-ring focus:outline-none focus:shadow-md"
    >
      Skip to main content
    </a>
  );
}