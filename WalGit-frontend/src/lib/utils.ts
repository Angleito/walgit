import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Truncates a string in the middle, preserving the start and end characters.
 * Useful for displaying wallet addresses in a user-friendly way.
 * @param str The string to truncate
 * @param startChars Number of characters to preserve at the beginning
 * @param endChars Number of characters to preserve at the end
 * @returns The truncated string with an ellipsis in the middle
 */
export function truncateMiddle(str: string, startChars: number = 4, endChars: number = 4): string {
  if (!str) return '';
  if (str.length <= startChars + endChars) return str;
  
  const start = str.substring(0, startChars);
  const end = str.substring(str.length - endChars);
  
  return `${start}...${end}`;
}
