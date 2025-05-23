'use client';

import { useState, useEffect, useCallback } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { 
  getTourAnalytics, saveTourAnalytics,
  getCompletedTours, saveCompletedTour, resetCompletedTour,
  getTourHistory, updateTourHistory
} from '@/utils/tour-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  X,
  LifeBuoy,
  Lightbulb,
  ThumbsUp,
  Clock,
  HelpCircle,
  Book,
  Github,
  GitBranch,
  GitPullRequest,
  Settings,
  Code,
  PlayCircle,
  Database,
  Users,
  Rocket,
  MessageSquare,
  CheckCircle
} from 'lucide-react';

export interface TourStep {
  target: string;
  title: string;
  content: string | React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  spotlightClicks?: boolean;
  disableOverlay?: boolean;
  disableBeacon?: boolean;
  nextPath?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionCallback?: () => void;
  isOptional?: boolean;
}

interface GuidedTourProps {
  tourId: string;
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  allowSkip?: boolean;
  showProgress?: boolean;
  showStepIndicators?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * A guided tour component to highlight and explain UI elements to users
 */
export function GuidedTour({
  tourId,
  steps,
  isOpen,
  onClose,
  onComplete,
  allowSkip = true,
  showProgress = true,
  showStepIndicators = true,
  theme = 'auto'
}: GuidedTourProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(0);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
    transformOrigin: 'center bottom'
  });
  const [tourStartTime, setTourStartTime] = useState<Date | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  
  // Initialize portal container
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const container = document.createElement('div');
      container.id = 'guided-tour-portal';
      container.setAttribute('data-theme', theme);
      document.body.appendChild(container);
      setPortalContainer(container);

      if (isOpen && !tourStartTime) {
        setTourStartTime(new Date());
      }

      return () => {
        // Check if the container still exists in the DOM before removing it
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      };
    }
  }, [isOpen, theme, tourStartTime]);
  
  // Find target element and position tooltip
  useEffect(() => {
    if (!isOpen || !steps[currentStep] || !portalContainer) return;
    
    const targetSelector = steps[currentStep].target;
    const target = document.querySelector(targetSelector) as HTMLElement;
    
    if (target) {
      setTargetElement(target);
      positionTooltip(target, steps[currentStep].position || 'bottom');
      setShowTooltip(true);
    } else {
      console.warn(`Target element ${targetSelector} not found`);
      setTargetElement(null);
      setShowTooltip(false);
    }
  }, [isOpen, currentStep, steps, portalContainer, pathname]);
  
  // Position tooltip relative to target element
  const positionTooltip = (target: HTMLElement, position: 'top' | 'right' | 'bottom' | 'left') => {
    const targetRect = target.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    
    let top = 0;
    let left = 0;
    let transformOrigin = '';
    
    switch (position) {
      case 'top':
        top = targetRect.top + scrollTop - 10;
        left = targetRect.left + scrollLeft + targetRect.width / 2;
        transformOrigin = 'center bottom';
        break;
      case 'right':
        top = targetRect.top + scrollTop + targetRect.height / 2;
        left = targetRect.right + scrollLeft + 10;
        transformOrigin = 'left center';
        break;
      case 'bottom':
        top = targetRect.bottom + scrollTop + 10;
        left = targetRect.left + scrollLeft + targetRect.width / 2;
        transformOrigin = 'center top';
        break;
      case 'left':
        top = targetRect.top + scrollTop + targetRect.height / 2;
        left = targetRect.left + scrollLeft - 10;
        transformOrigin = 'right center';
        break;
    }
    
    setTooltipPosition({
      top,
      left,
      transformOrigin
    });
  };
  
  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as completed
      setCompletedSteps(prev => ({
        ...prev,
        [currentStep]: true
      }));

      // Check if next step requires navigation
      if (steps[currentStep].nextPath) {
        router.push(steps[currentStep].nextPath);
      }

      // Execute action callback if provided
      if (steps[currentStep].actionCallback) {
        steps[currentStep].actionCallback();
      }

      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  // Skip to specific step
  const skipToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      if (steps[stepIndex].nextPath) {
        router.push(steps[stepIndex].nextPath);
      }
      setCurrentStep(stepIndex);
    }
  };
  
  // Handle previous step
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle tour completion
  const handleComplete = () => {
    setShowTooltip(false);

    // Mark all steps as completed
    const allCompleted = steps.reduce((acc, _, index) => {
      acc[index] = true;
      return acc;
    }, {} as Record<number, boolean>);
    setCompletedSteps(allCompleted);

    // Save tour analytics
    if (typeof window !== 'undefined' && tourStartTime) {
      const tourDuration = new Date().getTime() - tourStartTime.getTime();
      const tourAnalytics = getTourAnalytics();

      tourAnalytics[tourId] = {
        completedAt: new Date().toISOString(),
        durationMs: tourDuration,
        stepsCompleted: Object.keys(completedSteps).length,
        totalSteps: steps.length
      };

      saveTourAnalytics(tourAnalytics);

      // Save completed tour
      saveCompletedTour(tourId);
    }

    onComplete();
  };
  
  // Handle tour close
  const handleClose = () => {
    setShowTooltip(false);
    onClose();
  };
  
  // Create highlight effect around target element
  const renderHighlight = () => {
    if (!targetElement || !isOpen) return null;
    
    const targetRect = targetElement.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    
    return (
      <div
        className="absolute z-50 pointer-events-none"
        style={{
          top: targetRect.top + scrollTop - 8,
          left: targetRect.left + scrollLeft - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 15px rgba(59, 130, 246, 0.5)',
          borderRadius: '4px',
          border: '2px solid rgb(59, 130, 246)',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        {steps[currentStep].spotlightClicks && (
          <div
            className="absolute inset-0 cursor-pointer"
            style={{ pointerEvents: 'all' }}
            onClick={(e) => {
              if (targetElement && steps[currentStep].spotlightClicks) {
                e.preventDefault();
                e.stopPropagation();
                targetElement.click();
                setTimeout(handleNext, 500);
              }
            }}
          />
        )}
      </div>
    );
  };
  
  // Render tooltip content
  const renderTooltip = () => {
    if (!showTooltip || !isOpen || !steps[currentStep]) return null;

    const {
      title,
      content,
      position = 'bottom',
      icon,
      actionLabel,
      actionCallback,
      isOptional
    } = steps[currentStep];

    // Calculate arrow position
    let arrowStyle = {};
    switch (position) {
      case 'top':
        arrowStyle = {
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          borderRight: '1px solid rgba(0, 0, 0, 0.1)'
        };
        break;
      case 'right':
        arrowStyle = {
          left: -8,
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
        };
        break;
      case 'bottom':
        arrowStyle = {
          top: -8,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          borderLeft: '1px solid rgba(0, 0, 0, 0.1)'
        };
        break;
      case 'left':
        arrowStyle = {
          right: -8,
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          borderRight: '1px solid rgba(0, 0, 0, 0.1)'
        };
        break;
    }

    return (
      <div
        className="fixed z-50 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform:
            position === 'top' ? 'translateX(-50%) translateY(-100%)' :
            position === 'right' ? 'translateY(-50%)' :
            position === 'bottom' ? 'translateX(-50%)' :
            'translateX(-100%) translateY(-50%)',
          transformOrigin: tooltipPosition.transformOrigin,
          transition: 'all 0.3s ease-in-out'
        }}
      >
        {/* Arrow */}
        <div
          className="absolute w-4 h-4 bg-white dark:bg-gray-800"
          style={arrowStyle}
        />

        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
          onClick={handleClose}
          aria-label="Close tour"
        >
          <X size={16} />
        </button>

        {/* Header with icon */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            {icon || <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          </div>
          <div>
            <h3 className="text-lg font-medium dark:text-white">{title}</h3>
            {isOptional && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                Optional
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-300">{content}</div>

          {actionLabel && actionCallback && (
            <Button
              className="mt-3 w-full"
              size="sm"
              onClick={() => {
                actionCallback();
                handleNext();
              }}
            >
              {actionLabel}
            </Button>
          )}
        </div>

        {/* Navigation and progress */}
        <div className="border-t border-gray-100 dark:border-gray-700 p-4">
          {showProgress && (
            <div className="mb-3">
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{currentStep + 1} of {steps.length}</span>
              </div>
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {showStepIndicators && (
            <div className="flex justify-center gap-1 mb-3">
              {steps.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full ${index === currentStep
                    ? 'bg-blue-500'
                    : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'}`}
                  onClick={() => skipToStep(index)}
                  disabled={index > currentStep + 1}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              {currentStep > 0 && (
                <Button size="sm" variant="outline" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {allowSkip && isOptional && (
                <Button size="sm" variant="ghost" onClick={handleNext}>
                  Skip
                </Button>
              )}

              {currentStep < steps.length - 1 ? (
                <Button size="sm" onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleComplete}>
                  Finish
                  <ThumbsUp className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  if (!portalContainer || !isOpen) return null;
  
  return (
    <>
      {createPortal(
        <>
          {renderHighlight()}
          {renderTooltip()}
        </>,
        portalContainer
      )}
    </>
  );
}

/**
 * Custom hook to manage guided tours
 */
export function useGuidedTour(tourId: string, steps: TourStep[], autoOpen = true, delay = 1000) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tourHistory, setTourHistory] = useState<{
    startCount: number;
    completeCount: number;
    lastOpened?: string;
    lastCompleted?: string;
  } | null>(null);

  // Check if tour is completed or should be shown
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completedTours = getCompletedTours();
      const tourHistoryData = getTourHistory();

      setIsCompleted(!!completedTours[tourId]);
      setTourHistory(tourHistoryData[tourId] || {
        startCount: 0,
        completeCount: 0
      });

      // Auto-open tour if not completed and autoOpen is true
      if (!completedTours[tourId] && autoOpen) {
        const timeout = setTimeout(() => {
          setIsOpen(true);

          // Update tour history
          const updatedHistory = {
            ...tourHistoryData[tourId] || {
              startCount: 0,
              completeCount: 0
            },
            startCount: (tourHistoryData[tourId]?.startCount || 0) + 1,
            lastOpened: new Date().toISOString()
          };

          tourHistoryData[tourId] = updatedHistory;
          updateTourHistory(tourId, updatedHistory);
          setTourHistory(updatedHistory);

        }, delay);

        return () => clearTimeout(timeout);
      }
    }
  }, [tourId, autoOpen, delay]);

  // Open tour
  const openTour = useCallback(() => {
    setIsOpen(true);
    setCurrentStepIndex(0);

    // Update tour history
    if (typeof window !== 'undefined') {
      const tourHistoryData = getTourHistory();

      const updatedHistory = {
        ...tourHistoryData[tourId] || {
          startCount: 0,
          completeCount: 0
        },
        startCount: (tourHistoryData[tourId]?.startCount || 0) + 1,
        lastOpened: new Date().toISOString()
      };

      updateTourHistory(tourId, updatedHistory);
      setTourHistory(updatedHistory);
    }
  }, [tourId]);

  // Close tour
  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Jump to specific step
  const jumpToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStepIndex(step);
      if (!isOpen) {
        setIsOpen(true);
      }
    }
  }, [steps.length, isOpen]);

  // Mark tour as completed
  const completeTour = useCallback(() => {
    setIsOpen(false);
    setIsCompleted(true);

    // Update tour completion in localStorage
    if (typeof window !== 'undefined') {
      // Save completed tour status
      saveCompletedTour(tourId);

      // Update tour history
      const tourHistoryData = getTourHistory();

      const updatedHistory = {
        ...tourHistoryData[tourId] || {
          startCount: 0,
          completeCount: 0
        },
        completeCount: (tourHistoryData[tourId]?.completeCount || 0) + 1,
        lastCompleted: new Date().toISOString()
      };

      updateTourHistory(tourId, updatedHistory);
      setTourHistory(updatedHistory);
    }
  }, [tourId]);

  // Reset tour completion status
  const resetTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      resetCompletedTour(tourId);
      setIsCompleted(false);
      setCurrentStepIndex(0);
    }
  }, [tourId]);

  return {
    isOpen,
    isCompleted,
    currentStepIndex,
    tourHistory,
    openTour,
    closeTour,
    jumpToStep,
    completeTour,
    resetTour
  };
}

/**
 * Help Button component that opens a guided tour
 */
export function TourHelpButton({
  onClick,
  label = 'Help Tour',
  position = 'bottom-right',
  variant = 'outline'
}: {
  onClick: () => void,
  label?: string,
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left',
  variant?: 'outline' | 'default' | 'secondary'
}) {
  const positionClass = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }[position];

  return (
    <Button
      variant={variant}
      size="sm"
      className={`fixed ${positionClass} z-40 bg-white dark:bg-gray-800 shadow-md`}
      onClick={onClick}
    >
      <LifeBuoy className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}

/**
 * Feature Spotlight component for highlighting new features
 */
export function FeatureSpotlight({
  title,
  description,
  onDismiss,
  onAction,
  actionText,
  position = 'bottom-right',
  icon = <Lightbulb className="h-5 w-5 text-blue-600" />
}: {
  title: string;
  description: string | React.ReactNode;
  onDismiss: () => void;
  onAction?: () => void;
  actionText?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  icon?: React.ReactNode;
}) {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-4 z-40 animate-slideUp`}
    >
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        onClick={onDismiss}
        aria-label="Dismiss spotlight"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        <div className="mt-1 bg-blue-100 dark:bg-blue-900 rounded-full p-2">
          {icon}
        </div>

        <div>
          <h3 className="font-medium text-base mb-1 dark:text-white">{title}</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300">{description}</div>

          <div className="flex mt-3 gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
            >
              Dismiss
            </Button>

            {onAction && actionText && (
              <Button
                size="sm"
                onClick={() => {
                  onAction();
                  onDismiss();
                }}
              >
                {actionText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Onboarding Progress Indicator
 */
export function OnboardingProgress({
  steps,
  currentStep,
  onStepClick,
  className = ''
}: {
  steps: { name: string; isCompleted: boolean }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-blue-500" />
        <div className="text-sm font-medium dark:text-white">Onboarding Progress</div>

        <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {currentStep + 1}/{steps.length}
        </div>
      </div>

      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, ((currentStep + 1) / steps.length) * 100)}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => onStepClick?.(index)}
            disabled={!onStepClick}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${step.isCompleted
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : index === currentStep
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            } ${onStepClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          >
            {step.name}
          </button>
        ))}
      </div>
    </div>
  );
}