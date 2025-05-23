'use client';

import React from 'react';
import { useKeyboardShortcuts } from '@/lib/accessibility';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Button } from './button';
import { Keyboard } from 'lucide-react';

interface ShortcutGroup {
  name: string;
  shortcuts: {
    description: string;
    keys: string[];
  }[];
}

interface KeyboardShortcutsProps {
  groups: ShortcutGroup[];
}

/**
 * Helper component to display a keyboard key
 */
function KeyboardKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
      {children}
    </kbd>
  );
}

/**
 * Component to display and manage keyboard shortcuts
 */
export function KeyboardShortcuts({ groups }: KeyboardShortcutsProps) {
  // Register global shortcuts
  useKeyboardShortcuts({
    '?': () => document.getElementById('keyboard-shortcuts-trigger')?.click(),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          aria-label="Keyboard shortcuts"
          className="ml-2"
          id="keyboard-shortcuts-trigger"
        >
          <Keyboard className="h-4 w-4" />
          <span className="sr-only">Keyboard shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500 mb-4">
            Press <KeyboardKey>?</KeyboardKey> anywhere to open this dialog.
          </p>
          
          {groups.map((group) => (
            <div key={group.name} className="mb-6">
              <h3 className="text-sm font-medium mb-2">{group.name}</h3>
              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y">
                    {group.shortcuts.map((shortcut) => (
                      <tr key={shortcut.description} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {shortcut.description}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {shortcut.keys.map((key, index) => (
                              <React.Fragment key={index}>
                                <KeyboardKey>{key}</KeyboardKey>
                                {index < shortcut.keys.length - 1 && (
                                  <span className="text-gray-500">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          <div className="mt-6 text-sm text-gray-500">
            <p>
              Keyboard shortcuts help navigate the application more efficiently. They are especially
              useful for users who prefer or require keyboard navigation.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Default keyboard shortcuts for the application
 */
export const defaultShortcuts: ShortcutGroup[] = [
  {
    name: 'Navigation',
    shortcuts: [
      { description: 'Go to Home', keys: ['Alt', 'H'] },
      { description: 'Go to Repositories', keys: ['Alt', 'R'] },
      { description: 'Go to Explore', keys: ['Alt', 'E'] },
      { description: 'Go to Documentation', keys: ['Alt', 'D'] },
      { description: 'Create Repository', keys: ['Alt', 'N'] },
    ],
  },
  {
    name: 'General',
    shortcuts: [
      { description: 'Show keyboard shortcuts', keys: ['?'] },
      { description: 'Focus search', keys: ['Ctrl', 'K'] },
      { description: 'Skip to main content', keys: ['Alt', '1'] },
    ],
  },
];