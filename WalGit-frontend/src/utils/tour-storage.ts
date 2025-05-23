'use client';

/**
 * Safe localStorage access for tour-related data
 * Prevents errors in SSR contexts and handles failures gracefully
 */

export function getTourAnalytics(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('tourAnalytics') || '{}');
  } catch (error) {
    console.error('Error reading tour analytics from localStorage:', error);
    return {};
  }
}

export function saveTourAnalytics(data: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('tourAnalytics', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving tour analytics to localStorage:', error);
  }
}

export function getCompletedTours(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('completedTours') || '{}');
  } catch (error) {
    console.error('Error reading completed tours from localStorage:', error);
    return {};
  }
}

export function saveCompletedTour(tourId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const completedTours = getCompletedTours();
    completedTours[tourId] = true;
    localStorage.setItem('completedTours', JSON.stringify(completedTours));
  } catch (error) {
    console.error('Error saving completed tour to localStorage:', error);
  }
}

export function resetCompletedTour(tourId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const completedTours = getCompletedTours();
    delete completedTours[tourId];
    localStorage.setItem('completedTours', JSON.stringify(completedTours));
  } catch (error) {
    console.error('Error resetting completed tour in localStorage:', error);
  }
}

export function getTourHistory(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('tourHistory') || '{}');
  } catch (error) {
    console.error('Error reading tour history from localStorage:', error);
    return {};
  }
}

export function updateTourHistory(tourId: string, data: any): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getTourHistory();
    history[tourId] = { ...history[tourId], ...data };
    localStorage.setItem('tourHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Error updating tour history in localStorage:', error);
  }
}