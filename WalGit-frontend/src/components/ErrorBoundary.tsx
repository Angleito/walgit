import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Optional fallback UI
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service here
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <h2>Something went wrong.</h2>
            <p>
              There was an error loading this part of the application. Wallet
              features might be unavailable due to browser restrictions.
            </p>
            {this.state.error && (
              <pre style={{ fontSize: "0.8em", color: "grey" }}>
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 