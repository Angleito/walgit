'use client';

import { useEffect, useState } from 'react';
import * as React from 'react';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStorage } from '@/hooks/use-storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';

type Theme = 'light' | 'dark' | 'system';
type Accent = 'blue' | 'green' | 'purple' | 'orange' | 'red';

interface ThemeSettings {
  theme: Theme;
  accent: Accent;
}

// Create theme context
const ThemeContext = React.createContext<{
  theme: Theme;
  accent: Accent;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
}>({
  theme: 'system',
  accent: 'blue',
  setTheme: () => {},
  setAccent: () => {},
});

// Hook to use theme
export const useTheme = () => React.useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultAccent?: Accent;
  storageKey?: string;
}

/**
 * Theme Provider component
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultAccent = 'blue',
  storageKey = 'walgit-theme',
}: ThemeProviderProps) {
  // Use the storage hook for theme settings
  const [settings, setSettings] = useStorage<ThemeSettings>(
    storageKey, 
    { theme: defaultTheme, accent: defaultAccent }
  );
  
  const [mounted, setMounted] = useState(false);

  // Update theme class on document
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      return;
    }

    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    // Ensure settings is an object with theme and accent properties
    const themeSettings = settings && typeof settings === 'object' && 'theme' in settings 
      ? settings 
      : { theme: defaultTheme, accent: defaultAccent };
    
    const { theme, accent } = themeSettings;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Update accent color
    root.style.setProperty('--accent-color', getAccentColor(accent));
    root.style.setProperty('--accent-foreground-color', getAccentForegroundColor(accent));
  }, [settings, mounted, defaultTheme, defaultAccent]);

  // Ensure settings is an object with theme and accent properties
  const themeSettings = settings && typeof settings === 'object' && 'theme' in settings 
    ? settings 
    : { theme: defaultTheme, accent: defaultAccent };

  // Handle theme change
  const setTheme = (newTheme: Theme) => {
    setSettings({ ...themeSettings, theme: newTheme });
  };

  // Handle accent change
  const setAccent = (newAccent: Accent) => {
    setSettings({ ...themeSettings, accent: newAccent });
  };

  // Get accent color value
  function getAccentColor(accent: Accent): string {
    switch (accent) {
      case 'blue':
        return 'rgb(59, 130, 246)';
      case 'green':
        return 'rgb(16, 185, 129)';
      case 'purple':
        return 'rgb(139, 92, 246)';
      case 'orange':
        return 'rgb(249, 115, 22)';
      case 'red':
        return 'rgb(239, 68, 68)';
      default:
        return 'rgb(59, 130, 246)';
    }
  }

  // Get accent foreground color value
  function getAccentForegroundColor(accent: Accent): string {
    return 'rgb(255, 255, 255)';
  }

  // Always provide the context, even when not mounted
  const contextValue = {
    theme: mounted ? themeSettings.theme : defaultTheme,
    accent: mounted ? themeSettings.accent : defaultAccent,
    setTheme,
    setAccent
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Theme toggle component
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, accent, setAccent } = useTheme();
  
  // Theme icons for the dropdown
  const themeIcons = {
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
    system: <Monitor className="w-4 h-4" />,
  };

  // Available accent colors for the dropdown
  const accentColors = [
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'purple', label: 'Purple' },
    { value: 'orange', label: 'Orange' },
    { value: 'red', label: 'Red' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
        >
          {themeIcons[theme]}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme('light')}
        >
          <Sun className="w-4 h-4 mr-2" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
        >
          <Moon className="w-4 h-4 mr-2" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
        >
          <Monitor className="w-4 h-4 mr-2" />
          <span>System</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="w-4 h-4 mr-2" />
            <span>Accent Color</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {accentColors.map(({ value, label }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setAccent(value as Accent)}
                >
                  <div
                    className="w-4 h-4 mr-2 rounded-full"
                    style={{
                      backgroundColor:
                        value === 'blue'
                          ? 'rgb(59, 130, 246)'
                          : value === 'green'
                          ? 'rgb(16, 185, 129)'
                          : value === 'purple'
                          ? 'rgb(139, 92, 246)'
                          : value === 'orange'
                          ? 'rgb(249, 115, 22)'
                          : 'rgb(239, 68, 68)',
                    }}
                  />
                  <span>{label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}