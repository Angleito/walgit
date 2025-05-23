'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { GuidedTour, useGuidedTour, type TourStep } from './guided-tour';
import { predefinedTours, TourLauncher } from './tour-templates';
import { safeGetStorage, safeSetStorage } from '@/hooks/use-storage';

// Tour Context Interface
interface TourContextType {
  startTour: (tourId: string) => void;
  endTour: (tourId: string) => void;
  resetTour: (tourId: string) => void;
  isAnyTourActive: boolean;
  activeTourId: string | null;
  showTourLauncher: boolean;
  setShowTourLauncher: (show: boolean) => void;
}

// Create context with default values
const TourContext = createContext<TourContextType>({
  startTour: () => {},
  endTour: () => {},
  resetTour: () => {},
  isAnyTourActive: false,
  activeTourId: null,
  showTourLauncher: true,
  setShowTourLauncher: () => {},
});

// Tour provider props
interface TourProviderProps {
  children: ReactNode;
  customTours?: Record<string, TourStep[]>;
}

/**
 * Tour Provider Component
 * Manages guided tours throughout the application
 */
export function TourProvider({ children, customTours = {} }: TourProviderProps) {
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [activeTourSteps, setActiveTourSteps] = useState<TourStep[]>([]);
  const [showTourLauncher, setShowTourLauncher] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  
  // Combine predefined tours with custom tours
  const allTours = {
    ...predefinedTours,
    ...customTours
  };
  
  // Tour hook for the active tour
  const {
    isOpen,
    openTour,
    closeTour,
    completeTour,
    resetTour: resetTourState
  } = useGuidedTour(activeTourId || 'none', activeTourSteps, false);
  
  // Start a tour - defined before usage in useEffect
  const startTour = useCallback((tourId: string) => {
    if (allTours[tourId]) {
      setActiveTourId(tourId);
      setActiveTourSteps(allTours[tourId]);
      setTimeout(() => {
        openTour();
      }, 300);
    } else {
      console.warn(`Tour "${tourId}" not found.`);
    }
  }, [allTours, openTour]);
  
  // Check if it's user's first visit
  useEffect(() => {
    const hasVisitedBefore = safeGetStorage('hasVisitedBefore', null);
    if (!hasVisitedBefore) {
      setIsFirstVisit(true);
      safeSetStorage('hasVisitedBefore', true);
    }
  }, []);
  
  // Auto-start welcome tour for first-time visitors
  useEffect(() => {
    if (isFirstVisit && !activeTourId) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startTour('main');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit, activeTourId, startTour]);
  
  // End current tour
  const endTour = (tourId: string) => {
    if (activeTourId === tourId) {
      completeTour();
      setActiveTourId(null);
      setActiveTourSteps([]);
    }
  };
  
  // Reset tour to make it available again
  const resetTour = (tourId: string) => {
    if (allTours[tourId]) {
      if (activeTourId === tourId) {
        closeTour();
        setActiveTourId(null);
        setActiveTourSteps([]);
      }
      resetTourState();
    }
  };
  
  // Context value
  const contextValue: TourContextType = {
    startTour,
    endTour,
    resetTour,
    isAnyTourActive: isOpen,
    activeTourId,
    showTourLauncher,
    setShowTourLauncher
  };
  
  return (
    <TourContext.Provider value={contextValue}>
      {children}
      
      {/* Render active tour */}
      {activeTourId && activeTourSteps.length > 0 && (
        <GuidedTour
          tourId={activeTourId}
          steps={activeTourSteps}
          isOpen={isOpen}
          onClose={() => closeTour()}
          onComplete={() => endTour(activeTourId)}
          showProgress={true}
          showStepIndicators={true}
          theme="auto"
        />
      )}
      
      {/* Tour launcher */}
      {showTourLauncher && !isOpen && (
        <TourLauncher onStartTour={startTour} />
      )}
    </TourContext.Provider>
  );
}

// Custom hook to use the tour context
export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}