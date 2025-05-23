'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types
export type NotificationType = 'info' | 'success' | 'error' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Provider component for notifications
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  // Initialize portal container
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let container = document.getElementById('notification-portal');
      
      if (!container) {
        container = document.createElement('div');
        container.id = 'notification-portal';
        document.body.appendChild(container);
      }
      
      setPortalContainer(container);
      
      return () => {
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      };
    }
  }, []);
  
  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      autoClose: notification.autoClose !== false,
      duration: notification.duration || 5000,
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-close notification after duration
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
    
    return id;
  };
  
  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };
  
  // Context value
  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {typeof window !== 'undefined' && portalContainer ? (
        createPortal(
          <NotificationContainer 
            notifications={notifications} 
            removeNotification={removeNotification} 
          />,
          portalContainer
        )
      ) : null}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use the notification system
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
}

/**
 * Notification Container Component
 */
function NotificationContainer({ 
  notifications, 
  removeNotification 
}: { 
  notifications: Notification[]; 
  removeNotification: (id: string) => void; 
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onClose={() => removeNotification(notification.id)} 
        />
      ))}
    </div>
  );
}

/**
 * Individual Notification Item
 */
function NotificationItem({ 
  notification, 
  onClose 
}: { 
  notification: Notification; 
  onClose: () => void; 
}) {
  // Icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  // Background color based on notification type
  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };
  
  return (
    <div 
      className={`p-4 rounded-lg shadow-md border ${getBgColor()} animate-slideLeft`}
      role="alert"
    >
      <div className="flex items-start">
        {/* Icon */}
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        {/* Content */}
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{notification.title}</h3>
          <div className="mt-1 text-sm text-gray-700">
            {notification.message}
          </div>
          
          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-2 flex space-x-2">
              {notification.actions.map((action, index) => (
                <Button 
                  key={index} 
                  size="sm" 
                  variant={action.variant || 'default'} 
                  onClick={() => {
                    action.onClick();
                    onClose();
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {/* Close button */}
        <button
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Notification Bell with badge for unread notifications
 */
export function NotificationBell({ 
  count = 0,
  onClick,
}: { 
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      onClick={onClick}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

/**
 * Notification Center Component
 * Shows a list of all notifications in a panel
 */
export function NotificationCenter({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { notifications, removeNotification, clearAll } = useNotification();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative bg-white shadow-xl w-full max-w-md h-screen overflow-y-auto animate-slideInRight">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-medium">Notifications</h2>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearAll}
              >
                Clear All
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Bell className="h-12 w-12 mb-2 text-gray-300" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map(notification => (
              <div key={notification.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                    {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                    {notification.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                  </div>
                  
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                    
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="mt-2 flex space-x-2">
                        {notification.actions.map((action, index) => (
                          <Button 
                            key={index} 
                            size="sm" 
                            variant={action.variant || 'default'} 
                            onClick={() => {
                              action.onClick();
                              removeNotification(notification.id);
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
                    onClick={() => removeNotification(notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}