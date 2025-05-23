import React from "react";

/**
 * Key code constants for common keyboard keys
 */
export const Keys = {
  TAB: "Tab",
  ENTER: "Enter",
  ESCAPE: "Escape",
  SPACE: " ",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
  END: "End",
  HOME: "Home",
  ARROW_LEFT: "ArrowLeft",
  ARROW_UP: "ArrowUp",
  ARROW_RIGHT: "ArrowRight",
  ARROW_DOWN: "ArrowDown",
};

/**
 * Creates an ID that can be used for ARIA attributes
 * Uses React.useId() when available (React 18+), with fallback for older versions
 */
export function useId(prefix: string): string {
  // Use fallback implementation to avoid conditional hook calls
  const [id] = React.useState(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return id;
}

/**
 * Hook to manage focus trap within a container
 *
 * @param containerRef Reference to the container element
 * @param isActive Whether the focus trap is active
 * @param initialFocusRef Optional reference to the element that should receive initial focus
 * @param returnFocusOnDeactivate Whether to return focus to the previously focused element when deactivated
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean,
  initialFocusRef?: React.RefObject<HTMLElement>,
  returnFocusOnDeactivate: boolean = true
): void {
  // Store previously focused element
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (isActive && containerRef.current) {
      // Save currently focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement;

      // Get all focusable elements
      const focusableElements = containerRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      // Focus the initial element or the first focusable element
      const firstElement = initialFocusRef?.current || focusableElements[0] as HTMLElement;
      setTimeout(() => {
        firstElement.focus();
      }, 0);

      // Handle keyboard navigation
      const handleKeyDown = (e: KeyboardEvent) => {
        // Handle ESC key to exit if needed
        if (e.key === Keys.ESCAPE) {
          // You could call an onEscape callback here if provided
          return;
        }

        if (e.key !== Keys.TAB) return;

        // Don't trap if container no longer exists
        if (!containerRef.current) return;

        const firstFocusable = focusableElements[0] as HTMLElement;
        const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

        // Shift+Tab from first element goes to last
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
        // Tab from last element goes to first
        else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      };

      // Attach event listener
      document.addEventListener("keydown", handleKeyDown);

      // Make content outside the modal inert (not focusable)
      const allFocusableElements = document.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const elementCache = new Map<HTMLElement, string>();

      // Store and set tabindex to -1 for all elements outside the container
      allFocusableElements.forEach((el) => {
        const element = el as HTMLElement;
        if (!containerRef.current?.contains(element)) {
          elementCache.set(element, element.getAttribute('tabindex') || '');
          element.setAttribute('tabindex', '-1');
          if (element.hasAttribute('aria-hidden')) {
            elementCache.set(element, element.getAttribute('aria-hidden') || '');
          }
          element.setAttribute('aria-hidden', 'true');
        }
      });

      return () => {
        document.removeEventListener("keydown", handleKeyDown);

        // Restore previous tabindex values
        elementCache.forEach((originalValue, element) => {
          if (originalValue) {
            element.setAttribute('tabindex', originalValue);
          } else {
            element.removeAttribute('tabindex');
          }

          if (element.hasAttribute('aria-hidden')) {
            if (originalValue) {
              element.setAttribute('aria-hidden', originalValue);
            } else {
              element.removeAttribute('aria-hidden');
            }
          }
        });

        // Restore focus when unmounted
        if (returnFocusOnDeactivate && previousActiveElementRef.current && previousActiveElementRef.current.focus) {
          setTimeout(() => {
            previousActiveElementRef.current?.focus();
          }, 0);
        }
      };
    }
  }, [isActive, containerRef, initialFocusRef, returnFocusOnDeactivate]);
}

/**
 * Hook for handling keyboard navigation in collections like menus, listboxes, etc.
 *
 * @param options Array of item values or objects
 * @param onChange Callback when selection changes
 * @param defaultSelectedIndex Optional default selected index
 * @param orientation Optional orientation ('vertical' or 'horizontal')
 * @param loop Optional boolean to enable looping through items
 * @param typeAhead Optional boolean to enable type-ahead functionality
 */
export function useKeyboardNavigation<T>(
  options: T[],
  onChange: (value: T, index: number) => void,
  defaultSelectedIndex: number = 0,
  orientation: 'vertical' | 'horizontal' = 'vertical',
  loop: boolean = true,
  typeAhead: boolean = true
): {
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  getItemProps: (index: number) => Record<string, any>;
} {
  const [selectedIndex, setSelectedIndex] = React.useState(defaultSelectedIndex);

  // For type-ahead functionality
  const [searchString, setSearchString] = React.useState('');
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Function to get text value from option (handles both strings and objects)
  const getTextValue = React.useCallback((option: T): string => {
    if (typeof option === 'string') return option;
    if (option && typeof option === 'object' && 'label' in option) {
      return String((option as any).label);
    }
    if (option && typeof option === 'object' && 'name' in option) {
      return String((option as any).name);
    }
    return String(option);
  }, []);

  // Clear search string after delay
  const clearSearchString = React.useCallback(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setSearchString('');
    }, 1000);
  }, []);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      let nextIndex = selectedIndex;
      const isVertical = orientation === 'vertical';

      // Determine which keys to respond to based on orientation
      const prevKey = isVertical ? Keys.ARROW_UP : Keys.ARROW_LEFT;
      const nextKey = isVertical ? Keys.ARROW_DOWN : Keys.ARROW_RIGHT;

      switch (e.key) {
        case prevKey:
          e.preventDefault();
          if (selectedIndex > 0) {
            nextIndex = selectedIndex - 1;
          } else if (loop) {
            nextIndex = options.length - 1;
          }
          break;

        case nextKey:
          e.preventDefault();
          if (selectedIndex < options.length - 1) {
            nextIndex = selectedIndex + 1;
          } else if (loop) {
            nextIndex = 0;
          }
          break;

        case Keys.HOME:
          e.preventDefault();
          nextIndex = 0;
          break;

        case Keys.END:
          e.preventDefault();
          nextIndex = options.length - 1;
          break;

        case Keys.ENTER:
        case Keys.SPACE:
          e.preventDefault();
          onChange(options[selectedIndex], selectedIndex);
          return;

        default:
          // Type-ahead functionality
          if (typeAhead && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const char = e.key.toLowerCase();
            const newSearchString = searchString + char;
            setSearchString(newSearchString);

            // Find the first item that starts with the search string
            const index = options.findIndex(option =>
              getTextValue(option).toLowerCase().startsWith(newSearchString)
            );

            if (index !== -1) {
              nextIndex = index;
            } else {
              // If no match with current search string, try just the current character
              const singleCharIndex = options.findIndex(option =>
                getTextValue(option).toLowerCase().startsWith(char)
              );

              if (singleCharIndex !== -1) {
                nextIndex = singleCharIndex;
                setSearchString(char);
              }
            }

            clearSearchString();
          }
          return;
      }

      if (nextIndex !== selectedIndex) {
        setSelectedIndex(nextIndex);
        onChange(options[nextIndex], nextIndex);
      }
    },
    [options, selectedIndex, onChange, orientation, loop, searchString, getTextValue, clearSearchString, typeAhead]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Helper to get props for each item
  const getItemProps = React.useCallback((index: number) => {
    return {
      role: 'option',
      'aria-selected': index === selectedIndex,
      tabIndex: index === selectedIndex ? 0 : -1,
      id: `option-${index}`,
    };
  }, [selectedIndex]);

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    getItemProps
  };
}

/**
 * Creates an announcement for screen readers
 *
 * @param message The message to announce
 * @param politeness The politeness level ('assertive' or 'polite')
 * @param clearDelay Time in ms before clearing the announcement (default: 3000ms)
 */
export function announce(
  message: string,
  politeness: 'assertive' | 'polite' = 'polite',
  clearDelay: number = 3000
): void {
  if (!message) return;

  // Create the announcer element if it doesn't exist
  let announcer = document.getElementById(`accessibility-announcer-${politeness}`);

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = `accessibility-announcer-${politeness}`;
    announcer.setAttribute('aria-live', politeness);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.padding = '0';
    announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)';
    announcer.style.whiteSpace = 'nowrap';
    announcer.style.border = '0';
    document.body.appendChild(announcer);
  }

  // Empty the announcer first to ensure it will be announced again
  announcer.textContent = '';

  // Set the message (use setTimeout to ensure screen readers register the change)
  setTimeout(() => {
    if (announcer) announcer.textContent = message;
  }, 50);

  // Clear it after a delay to allow for repeated announcements
  if (clearDelay > 0) {
    setTimeout(() => {
      if (announcer) announcer.textContent = '';
    }, clearDelay);
  }
}

/**
 * Hook for managing announcements in components
 */
export function useAnnouncer() {
  const announcePolite = React.useCallback((message: string) => {
    announce(message, 'polite');
  }, []);

  const announceAssertive = React.useCallback((message: string) => {
    announce(message, 'assertive');
  }, []);

  return { announcePolite, announceAssertive };
}

/**
 * Hook for managing accessible keyboard shortcuts
 *
 * @param shortcuts Record of key combinations and their handler functions
 * @param active Whether shortcuts are active (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, (e: KeyboardEvent) => void>,
  active: boolean = true
): void {
  React.useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when focus is in input, textarea, or contentEditable
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      // Generate the key combination string (e.g., "ctrl+a")
      const keyCombo = [
        e.ctrlKey ? 'ctrl' : '',
        e.altKey ? 'alt' : '',
        e.shiftKey ? 'shift' : '',
        e.metaKey ? 'meta' : '',
        e.key.toLowerCase()
      ].filter(Boolean).join('+');

      // Check if the key combination is registered
      if (shortcuts[keyCombo]) {
        shortcuts[keyCombo](e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, active]);
}

// Skip link component moved to /components/ui/skip-link.tsx
export { SkipLink } from "@/components/ui/skip-link";

/**
 * Check if high contrast mode is active
 */
export function useHighContrastMode(): boolean {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    // Check for high contrast mode
    const mediaQuery = window.matchMedia('(forced-colors: active)');
    setIsHighContrast(mediaQuery.matches);

    // Update when it changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
}

/**
 * Check if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Update when it changes
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Helper to generate proper ARIA attributes for different component states
 */
export const ariaAttributes = {
  /**
   * Generate ARIA attributes for buttons used as toggles
   */
  toggle: (isPressed: boolean) => ({
    'aria-pressed': isPressed,
    role: 'button',
  }),

  /**
   * Generate ARIA attributes for expanded elements
   */
  expandable: (isExpanded: boolean) => ({
    'aria-expanded': isExpanded,
  }),

  /**
   * Generate ARIA attributes for elements with associated errors
   */
  error: (hasError: boolean, errorId?: string) => ({
    'aria-invalid': hasError,
    ...(hasError && errorId ? { 'aria-errormessage': errorId } : {}),
  }),

  /**
   * Generate ARIA attributes for required inputs
   */
  required: (isRequired: boolean) => ({
    'aria-required': isRequired,
  }),

  /**
   * Generate ARIA attributes for elements with loading state
   */
  loading: (isLoading: boolean) => ({
    'aria-busy': isLoading,
  }),

  /**
   * Generate ARIA attributes for elements with selected state
   */
  selected: (isSelected: boolean) => ({
    'aria-selected': isSelected,
  }),

  /**
   * Generate ARIA attributes for elements with checked state
   */
  checked: (isChecked: boolean) => ({
    'aria-checked': isChecked,
  }),

  /**
   * Generate ARIA attributes for current page/item
   */
  current: (isCurrent: boolean) => ({
    'aria-current': isCurrent ? 'page' : undefined,
  }),

  /**
   * Generate ARIA attributes for disabled elements
   */
  disabled: (isDisabled: boolean) => ({
    'aria-disabled': isDisabled,
  }),

  /**
   * Generate ARIA attributes for elements with labels
   */
  labelledBy: (id: string) => ({
    'aria-labelledby': id,
  }),

  /**
   * Generate ARIA attributes for elements with descriptions
   */
  describedBy: (id: string) => ({
    'aria-describedby': id,
  }),

  /**
   * Generate ARIA attributes for elements that own other elements
   */
  owns: (id: string) => ({
    'aria-owns': id,
  }),

  /**
   * Generate ARIA attributes for elements with controls
   */
  controls: (id: string) => ({
    'aria-controls': id,
  }),
};