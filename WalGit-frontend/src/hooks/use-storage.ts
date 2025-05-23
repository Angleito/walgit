'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for safely accessing localStorage in Next.js
 * 
 * @param key - The localStorage key
 * @param initialValue - The default value if no value is found
 * @returns A tuple containing the stored value and a setter function
 */
export function useStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prevValue: T) => T)) => void] {
  // State to hold the current value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from localStorage (client-side only)
  useEffect(() => {
    try {
      // Check if we're in the browser
      if (typeof window !== 'undefined' && !isInitialized) {
        const item = window.localStorage.getItem(key);
        // Parse stored json or return initialValue
        if (item) {
          setStoredValue(JSON.parse(item));
        }
        setIsInitialized(true);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue);
      setIsInitialized(true);
    }
  }, [key, initialValue, isInitialized]);

  // Return a wrapped version of localStorage's setter that saves to state
  const setValue = (value: T | ((prevValue: T) => T)): void => {
    try {
      // Allow value to be a function for previous state-based updates
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage (client-side only)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Safely get a value from localStorage (for use outside React components)
 */
export function safeGetStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    console.error(`Error safely getting localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely set a value in localStorage (for use outside React components)
 */
export function safeSetStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error safely setting localStorage key "${key}":`, error);
  }
}

/**
 * Safely remove a value from localStorage (for use outside React components)
 */
export function safeRemoveStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error safely removing localStorage key "${key}":`, error);
  }
}