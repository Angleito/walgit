/**
 * Safe storage utility - provides fallback when localStorage/sessionStorage is unavailable
 */

// In-memory fallback when storage is unavailable
const memoryStorage = new Map<string, string>();

// Check if storage is available
const isStorageAvailable = (type: 'localStorage' | 'sessionStorage'): boolean => {
  try {
    const storage = window[type];
    const testKey = `__storage_test__${Math.random()}`;
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn(`${type} is not available:`, e);
    return false;
  }
};

// Safe localStorage implementation
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (isStorageAvailable('localStorage')) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('Error accessing localStorage:', e);
    }
    return memoryStorage.get(key) || null;
  },
  
  setItem: (key: string, value: string): void => {
    try {
      if (isStorageAvailable('localStorage')) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Error setting localStorage item:', e);
    }
    memoryStorage.set(key, value);
  },
  
  removeItem: (key: string): void => {
    try {
      if (isStorageAvailable('localStorage')) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Error removing localStorage item:', e);
    }
    memoryStorage.delete(key);
  },
  
  clear: (): void => {
    try {
      if (isStorageAvailable('localStorage')) {
        localStorage.clear();
      }
    } catch (e) {
      console.warn('Error clearing localStorage:', e);
    }
    memoryStorage.clear();
  }
};

// Safe sessionStorage implementation (similar pattern)
export const safeSessionStorage = {
  // Similar methods for sessionStorage
  // Implement if needed
};
