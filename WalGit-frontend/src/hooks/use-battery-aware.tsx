'use client';

import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';
import { useBatteryStatus, useBatteryAwareValue } from './use-battery-status';

interface DeviceStatusOptions {
  /**
   * Check if device prefers reduced motion
   */
  checkReducedMotion?: boolean;

  /**
   * Check if device has low battery status
   */
  checkBattery?: boolean;

  /**
   * Low battery threshold (0-1)
   */
  lowBatteryThreshold?: number;

  /**
   * Check for data saver mode
   */
  checkDataSaver?: boolean;
}

interface DeviceStatus {
  /**
   * Whether the device prefers reduced motion
   */
  prefersReducedMotion: boolean;

  /**
   * Whether the device is in low battery mode
   */
  isLowBattery: boolean;

  /**
   * Whether the device is in data saver mode
   */
  isDataSaverEnabled: boolean;

  /**
   * Whether animations should be optimized
   */
  shouldOptimizeEffects: boolean;

  /**
   * Performance optimization level (0-3)
   * 0: Full effects (no optimization)
   * 1: Medium optimization (reduced animations)
   * 2: High optimization (minimal effects)
   * 3: Maximum optimization (essential UI only)
   */
  optimizationLevel: number;

  /**
   * Get optimized value based on current device status
   */
  getOptimizedValue: <T>(highPerf: T, mediumPerf: T, lowPerf: T) => T;
}

/**
 * Enhanced hook that detects device preferences and status to determine
 * if visual effects should be optimized for performance and battery life
 */
export function useBatteryAware(options: DeviceStatusOptions = {}): DeviceStatus {
  const {
    checkReducedMotion = true,
    checkBattery = true,
    lowBatteryThreshold = 0.2, // 20% battery level
    checkDataSaver = true
  } = options;

  const isMobile = useIsMobile();
  const batteryStatus = useBatteryStatus();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDataSaverEnabled, setIsDataSaverEnabled] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    if (!checkReducedMotion || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [checkReducedMotion]);

  // Check for data saver mode
  useEffect(() => {
    if (!checkDataSaver || typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.connection) return;

    // @ts-ignore - Navigator connection API typings
    const connection = navigator.connection;

    const updateDataSaverMode = () => {
      // @ts-ignore - saveData property may not be in typings yet
      if (connection.saveData !== undefined) {
        setIsDataSaverEnabled(connection.saveData);
      }
    };

    updateDataSaverMode();

    // Listen for connection changes
    connection.addEventListener('change', updateDataSaverMode);
    return () => connection.removeEventListener('change', updateDataSaverMode);
  }, [checkDataSaver]);

  // Determine if effects should be optimized
  const isLowBattery = batteryStatus.lowPowerMode || batteryStatus.level <= lowBatteryThreshold;
  const shouldOptimizeEffects = isMobile && (prefersReducedMotion || isLowBattery || isDataSaverEnabled);

  // Calculate optimization level (0-3) based on device status
  const getOptimizationLevel = (): number => {
    if (!isMobile) return 0; // No optimization for desktop

    let level = 0;

    // Critical factors that require maximum optimization
    if (prefersReducedMotion) return 3;

    // High optimization factors
    if (batteryStatus.lowPowerMode) level += 2;
    if (isDataSaverEnabled) level += 2;

    // Medium optimization factors
    if (batteryStatus.level <= 0.15) level += 2; // Very low battery
    else if (batteryStatus.level <= lowBatteryThreshold) level += 1;

    if (!batteryStatus.charging && batteryStatus.level <= 0.5) level += 1;

    // Cap at level 3
    return Math.min(level, 3);
  };

  const optimizationLevel = getOptimizationLevel();

  // Helper function to get optimized values based on the current status
  const getOptimizedValue = <T,>(highPerf: T, mediumPerf: T, lowPerf: T): T => {
    switch (optimizationLevel) {
      case 0: return highPerf;
      case 1: return mediumPerf;
      case 2:
      case 3: return lowPerf;
      default: return highPerf;
    }
  };

  return {
    prefersReducedMotion,
    isLowBattery,
    isDataSaverEnabled,
    shouldOptimizeEffects,
    optimizationLevel,
    getOptimizedValue
  };
}