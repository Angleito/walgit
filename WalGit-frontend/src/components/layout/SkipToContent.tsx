import React from 'react';
import { SkipLink } from '@/components/ui/skip-link';

/**
 * SkipToContent component provides a skip link for keyboard users
 * This component should be placed at the top of the layout, before the header
 */
export function SkipToContent({ targetId = 'main-content' }: { targetId?: string }) {
  return <SkipLink targetId={targetId} />;
}