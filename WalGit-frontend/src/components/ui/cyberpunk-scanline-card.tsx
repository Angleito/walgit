import React from 'react';
import { CyberpunkCard } from './cyberpunk-card';
import { ScanlineOverlay } from './scanline-overlay';

interface CyberpunkScanlineCardProps extends React.ComponentProps<typeof CyberpunkCard> {
  /**
   * Whether the scanline effect is enabled
   */
  scanlineEnabled?: boolean;

  /**
   * The intensity of the scanline effect
   */
  scanlineIntensity?: 'subtle' | 'medium' | 'strong';

  /**
   * The transparency of the scanline effect
   */
  scanlineTransparency?: 'low' | 'medium' | 'high';

  /**
   * The animation of the scanline effect
   */
  scanlineAnimation?: 'none' | 'flicker' | 'pulse';
}

/**
 * Enhanced cyberpunk card with optional CRT scanline effect.
 * Extends the regular CyberpunkCard with a scanline overlay.
 */
export const CyberpunkScanlineCard = ({
  scanlineEnabled = true,
  scanlineIntensity = 'medium',
  scanlineTransparency = 'medium',
  scanlineAnimation = 'flicker',
  ...props
}: CyberpunkScanlineCardProps) => {
  return (
    <ScanlineOverlay
      enabled={scanlineEnabled}
      intensity={scanlineIntensity}
      transparency={scanlineTransparency}
      animation={scanlineAnimation}
    >
      <CyberpunkCard {...props} />
    </ScanlineOverlay>
  );
};

export default CyberpunkScanlineCard;