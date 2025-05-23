# React Hook Form Usage Guide

This guide explains how to use the React Hook Form implementation with Zod validation in the WalGit application.

## Basic Usage

### 1. Define a Schema

First, add your form schema to `/src/lib/form-schemas.ts`:

```typescript
export const myFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  age: z.number().min(18, { message: "Must be 18 or older" }).optional(),
});

export type MyFormValues = z.infer<typeof myFormSchema>;
```

### 2. Create Your Form Component

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { myFormSchema, type MyFormValues } from '@/lib/form-schemas';

export function MyForm() {
  const form = useForm<MyFormValues>({
    resolver: zodResolver(myFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const onSubmit = async (values: MyFormValues) => {
    // Handle form submission
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

## Using Reusable Form Components

### CommentForm

```tsx
import { CommentForm } from '@/components/code-review/CommentForm';
import type { CommentFormValues } from '@/lib/form-schemas';

function MyComponent() {
  const handleSubmit = async (values: CommentFormValues) => {
    // Handle comment submission
    console.log(values);
  };

  return (
    <CommentForm
      onSubmit={handleSubmit}
      placeholder="Add your comment..."
      buttonText="Submit"
      filePath="/path/to/file.js"  // Optional
      lineNumber={42}  // Optional 
      autoFocus={true}  // Optional
    />
  );
}
```

### ReviewForm

```tsx
import { ReviewForm } from '@/components/code-review/ReviewForm';
import type { ReviewFormValues } from '@/lib/form-schemas';

function MyComponent() {
  const handleSubmit = async (values: ReviewFormValues) => {
    // Handle review submission
    console.log(values);
  };

  return (
    <ReviewForm
      pullRequestId="123"
      onSubmit={handleSubmit}
      onCancel={() => console.log('Cancelled')}
      className="mt-4"
    />
  );
}
```

## Form Validation

### Client-Side Validation

React Hook Form with Zod handles client-side validation automatically. Validation errors will be displayed under each field using the `FormMessage` component.

### Custom Validation

You can add custom validation to your Zod schema:

```typescript
export const customSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

## Form State

Access form state using React Hook Form:

```tsx
// Check if form is valid
const isValid = form.formState.isValid;

// Check for specific field errors
const hasNameError = !!form.formState.errors.name;

// Get current field values
const currentName = form.watch('name');

// Conditionally show fields based on other fields
{form.watch('showAdditionalFields') && (
  <FormField
    control={form.control}
    name="additionalInfo"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Additional Info</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)}
```

## Best Practices

1. **Keep schemas in one place**: Maintain all form schemas in `form-schemas.ts` for consistency
2. **Use proper typing**: Always use the inferred types from Zod schemas
3. **Disable submit on invalid**: Use `form.formState.isValid` to disable submit buttons when the form is invalid
4. **Provide meaningful error messages**: Customize Zod error messages to be user-friendly
5. **Handle loading states**: Show loading indicators during form submission

## Troubleshooting

- **Field not updating**: Ensure you're spreading the field prop in your form control
- **Validation not working**: Check that your schema is correctly defined and the resolver is properly set up
- **Type errors**: Make sure you're using the correct inferred type from your Zod schema
- **Radio/checkbox issues**: For these controls, use `onCheckedChange` for the onChange handler