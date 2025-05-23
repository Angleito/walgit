'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { commentSchema, type CommentFormValues } from '@/lib/form-schemas';

interface CommentFormProps {
  onSubmit: (values: CommentFormValues) => Promise<void> | void;
  placeholder?: string;
  buttonText?: string;
  userAvatar?: string;
  filePath?: string;
  lineNumber?: number;
  autoFocus?: boolean;
  initialValue?: string;
  className?: string;
}

/**
 * Reusable comment form component with validation
 */
export function CommentForm({
  onSubmit,
  placeholder = 'Write a comment...',
  buttonText = 'Comment',
  userAvatar,
  filePath,
  lineNumber,
  autoFocus = false,
  initialValue = '',
  className = '',
}: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: initialValue,
      filePath,
      lineNumber,
    },
  });

  // Handle form submission
  const handleSubmit = async (values: CommentFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
      form.reset({ content: '', filePath, lineNumber });
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-dark-200 rounded-md border p-3 ${className}`}>
      <div className="flex gap-3">
        {userAvatar && (
          <Avatar>
            <Image 
              src={userAvatar} 
              alt="User avatar"
              width={40}
              height={40}
              className="w-full h-full object-cover rounded-full" 
            />
          </Avatar>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={placeholder}
                      className="min-h-[80px] resize-y"
                      autoFocus={autoFocus}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end mt-2">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !form.formState.isValid}
                className="gap-1"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : buttonText}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}