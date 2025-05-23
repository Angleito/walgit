import * as React from "react"
import { cn } from "@/lib/utils"
import { useId, ariaAttributes } from "@/lib/accessibility"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Error message to display
   */
  error?: string;

  /**
   * Hide the error message visually, but keep it for screen readers
   */
  hideError?: boolean;

  /**
   * Whether the input has an error (can be used without an error message)
   */
  hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, hideError, hasError, id, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    // Generate unique IDs for accessibility
    const uniqueId = useId("input");
    const inputId = id || uniqueId;
    const errorId = error ? `${inputId}-error` : undefined;

    // Combine any existing aria-describedby with our error ID
    const describedBy = error
      ? ariaDescribedBy
        ? `${ariaDescribedBy} ${errorId}`
        : errorId
      : ariaDescribedBy;

    // Determine error state from either error string or hasError prop
    const isInvalid = Boolean(error) || hasError;

    return (
      <div className="flex flex-col gap-1 w-full">
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            isInvalid && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          aria-describedby={describedBy}
          {...ariaAttributes.error(isInvalid, errorId)}
          {...(props.required ? ariaAttributes.required(true) : {})}
          {...props}
        />
        {error && (
          <div
            id={errorId}
            className={cn(
              "text-sm text-red-500",
              hideError && "sr-only"
            )}
          >
            {error}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
