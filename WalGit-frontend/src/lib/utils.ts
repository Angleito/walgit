import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateMiddle(text: string, startLength = 6, endLength = 4) {
  if (!text) return "";
  if (text.length <= startLength + endLength) return text;
  return `${text.substring(0, startLength)}...${text.substring(
    text.length - endLength
  )}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}