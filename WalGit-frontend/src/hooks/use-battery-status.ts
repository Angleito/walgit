import { useState, useEffect } from 'react';

interface BatteryStatus {
  charging: boolean;
  level: number;
  lowPowerMode: boolean;
}

/**
 * Hook for detecting battery status and low power mode
 * Used to optimize cyberpunk effects on mobile devices
 * 
 * @returns BatteryStatus object with charging status, level and low power mode
 */
export function useBatteryStatus(): BatteryStatus {
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus>({
    charging: true,
    level: 1.0,
    lowPowerMode: false,
  });

  useEffect(() => {
    // Check if we're in the browser and the Battery API is available
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('getBattery' in navigator)) {
      return;
    }

    const updateBatteryStatus = (battery: any) => {
      // Get battery level and charging status
      const { charging, level } = battery;
      
      // Detect low power mode
      // Note: There's no direct API for this, so we use heuristics
      // - iOS devices throttle animation frames in low power mode
      // - 60fps → ~30fps in low power mode
      let frameCount = 0;
      let lastTime = performance.now();
      let testDuration = 0;
      let lowPowerMode = false;
      
      const testFrameRate = (timestamp: number) => {
        frameCount++;
        testDuration = timestamp - lastTime;
        
        // Test for 500ms
        if (testDuration < 500) {
          requestAnimationFrame(testFrameRate);
        } else {
          // Calculate frames per second
          const fps = (frameCount * 1000) / testDuration;
          
          // If fps is significantly below 60, device might be in low power mode
          // We use 45 as a threshold to account for normal variations
          lowPowerMode = fps < 45 && level < 0.2;
          
          setBatteryStatus({
            charging,
            level,
            lowPowerMode,
          });
        }
      };
      
      // Start testing frame rate
      requestAnimationFrame(testFrameRate);
    };

    // Get initial battery status
    (navigator as any).getBattery().then((battery: any) => {
      updateBatteryStatus(battery);
      
      // Listen for battery status changes
      battery.addEventListener('chargingchange', () => updateBatteryStatus(battery));
      battery.addEventListener('levelchange', () => updateBatteryStatus(battery));
    });
  }, []);

  return batteryStatus;
}

/**
 * Hook that provides optimized animation values based on battery status
 * Used to reduce intensity of effects when battery is low
 * 
 * @param normalValue - Value to use when battery is normal
 * @param lowPowerValue - Value to use when in low power mode
 * @returns The appropriate value based on device battery status
 */
export function useBatteryAwareValue<T>(normalValue: T, lowPowerValue: T): T {
  const { lowPowerMode } = useBatteryStatus();
  
  return lowPowerMode ? lowPowerValue : normalValue;
}