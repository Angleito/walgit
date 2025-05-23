import React, { ReactNode, useEffect } from 'react';

interface DebugWrapperProps {
  componentName: string;
  children: ReactNode;
}

export const DebugWrapper: React.FC<DebugWrapperProps> = ({ componentName, children }) => {
  useEffect(() => {
    // Log component mount
    console.log(`[DebugWrapper] ${componentName} mounted`);
    
    // Log children details
    if (children !== null && children !== undefined) {
      console.log(`[DebugWrapper] ${componentName} children type:`, typeof children);
      
      if (React.isValidElement(children)) {
        console.log(`[DebugWrapper] ${componentName} has valid React element`);
      } else if (Array.isArray(children)) {
        console.log(`[DebugWrapper] ${componentName} has array of ${children.length} children`);
        children.forEach((child, index) => {
          if (child && typeof child === 'object' && !React.isValidElement(child)) {
            console.warn(`[DebugWrapper] ${componentName} child[${index}] is object but not React element:`, child);
          }
        });
      } else if (typeof children === 'object' && !React.isValidElement(children)) {
        console.warn(`[DebugWrapper] ${componentName} has non-React object as children:`, children);
      }
    }
    
    return () => {
      console.log(`[DebugWrapper] ${componentName} unmounted`);
    };
  }, [componentName, children]);
  
  // Error boundary functionality
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      if (event.error?.toString().includes('Objects are not valid as a React child')) {
        console.error(`[DebugWrapper] ${componentName} caught React child error:`, event.error);
        setHasError(true);
        setError(event.error);
      }
    };
    
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, [componentName]);
  
  if (hasError && error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fee', 
        border: '1px solid #fcc',
        borderRadius: '4px',
        margin: '10px 0'
      }}>
        <h3 style={{ color: '#c00', margin: '0 0 10px 0' }}>
          Error in {componentName}
        </h3>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          borderRadius: '4px',
          overflow: 'auto'
        }}>
          {error.toString()}
        </pre>
        <details style={{ marginTop: '10px' }}>
          <summary style={{ cursor: 'pointer', color: '#666' }}>
            Debug Info
          </summary>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            marginTop: '5px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify({
              componentName,
              childrenType: typeof children,
              isArray: Array.isArray(children),
              isValidElement: React.isValidElement(children),
              childrenKeys: children && typeof children === 'object' ? Object.keys(children) : 'N/A'
            }, null, 2)}
          </pre>
        </details>
      </div>
    );
  }
  
  try {
    // Validate children before rendering
    if (children && typeof children === 'object' && !React.isValidElement(children) && !Array.isArray(children)) {
      console.error(`[DebugWrapper] ${componentName} has invalid children object:`, children);
      return (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          margin: '5px 0'
        }}>
          <strong>Warning:</strong> {componentName} received invalid children (object)
        </div>
      );
    }
    
    return <>{children}</>;
  } catch (err) {
    console.error(`[DebugWrapper] ${componentName} render error:`, err);
    return (
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#fee', 
        border: '1px solid #fcc',
        borderRadius: '4px'
      }}>
        Error rendering {componentName}: {err instanceof Error ? err.message : 'Unknown error'}
      </div>
    );
  }
};

// HOC version for easier wrapping
export function withDebugWrapper<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return React.forwardRef<any, P>((props, ref) => (
    <DebugWrapper componentName={componentName}>
      <Component {...props} ref={ref} />
    </DebugWrapper>
  ));
}