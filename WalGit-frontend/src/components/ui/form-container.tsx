import { ReactNode, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { ZodType } from "zod";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { announce } from "@/lib/accessibility";

interface FormContainerProps<T extends ZodType<any, any>, U> {
  form: UseFormReturn<U>;
  onSubmit: (values: U) => void;
  children: ReactNode;
  className?: string;
  id?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  announceErrors?: boolean;
}

/**
 * Form Container component that handles form submission
 * To be used with React Hook Form, with enhanced accessibility
 */
export function FormContainer<T extends ZodType<any, any>, U>({
  form,
  onSubmit,
  children,
  className,
  id,
  ariaLabel,
  ariaDescription,
  announceErrors = true,
}: FormContainerProps<T, U>) {
  // Announce form validation errors to screen readers
  useEffect(() => {
    const { isSubmitted, errors } = form.formState;

    if (isSubmitted && announceErrors && Object.keys(errors).length > 0) {
      const errorCount = Object.keys(errors).length;
      const errorMessage = `${errorCount} form ${errorCount === 1 ? 'error' : 'errors'} found. Please correct the highlighted fields.`;
      announce(errorMessage, 'assertive');
    }
  }, [form.formState, announceErrors]);

  return (
    <Form {...form}>
      <form
        id={id}
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-6", className)}
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? `${id || ''}-description` : undefined}
        noValidate
      >
        {ariaDescription && (
          <div id={`${id || ''}-description`} className="sr-only">
            {ariaDescription}
          </div>
        )}
        {children}
      </form>
    </Form>
  );
}