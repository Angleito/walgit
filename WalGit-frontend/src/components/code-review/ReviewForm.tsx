'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { reviewSchema, type ReviewFormValues } from '@/lib/form-schemas';

interface ReviewFormProps {
  pullRequestId: string;
  onSubmit: (values: ReviewFormValues) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

/**
 * Review form for submitting pull request reviews
 * Uses React Hook Form with Zod validation
 */
export function ReviewForm({
  pullRequestId,
  onSubmit,
  onCancel,
  className = '',
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      verdict: 'comment',
      comment: '',
    },
    mode: 'onChange',
  });

  // Handle form submission
  const handleSubmit = async (values: ReviewFormValues) => {
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
      form.reset();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`border shadow-sm ${className}`}>
      <CardHeader>
        <CardTitle>Review Changes</CardTitle>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="verdict"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Review Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="comment" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center">
                          <MessageCircle className="h-4 w-4 mr-2 text-gray-600" />
                          Comment only
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="approve" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Approve changes
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="request_changes" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center">
                          <XCircle className="h-4 w-4 mr-2 text-red-500" />
                          Request changes
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        form.watch('verdict') === 'approve'
                          ? 'Add any comments about these changes...'
                          : form.watch('verdict') === 'request_changes'
                          ? 'Describe what changes are needed...'
                          : 'Leave a comment on this pull request...'
                      }
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {form.watch('verdict') === 'request_changes' && 
                      'Be specific about what changes are needed and why.'
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2 border-t pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className={
                form.watch('verdict') === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : form.watch('verdict') === 'request_changes'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              {isSubmitting 
                ? 'Submitting...' 
                : form.watch('verdict') === 'approve'
                ? 'Approve'
                : form.watch('verdict') === 'request_changes'
                ? 'Request Changes'
                : 'Submit Review'
              }
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}