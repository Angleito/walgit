'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, GitBranch, GitCompare, ArrowLeft } from 'lucide-react';
import { GitCommit as Git } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  pullRequestSchema,
  type PullRequestFormValues
} from '@/lib/form-schemas';

/**
 * New Pull Request page
 * Form for creating a new pull request with form validation
 */
export default function NewPullRequestPage() {
  const router = useRouter();
  const params = useParams();
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<PullRequestFormValues>({
    resolver: zodResolver(pullRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      sourceBranch: '',
      targetBranch: 'main',
      isDraft: false
    },
    mode: 'onChange',
  });

  // Fetch repository branches
  useEffect(() => {
    async function fetchBranches() {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would call the API
        const response = await fetch(`/api/repositories/${params.owner}/${params.repo}/branches`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch branches');
        }
        
        const data = await response.json();
        setBranches(data);
        
        // Set default source branch to the first non-main branch, or first branch if only one exists
        if (data.length > 0) {
          const nonMainBranches = data.filter(branch => branch !== 'main');
          if (nonMainBranches.length > 0) {
            form.setValue('sourceBranch', nonMainBranches[0]);
          } else {
            form.setValue('sourceBranch', data[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branches. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    // For demo purposes, let's mock some branches
    setBranches(['main', 'develop', 'feature/new-ui', 'bugfix/login']);
    form.setValue('sourceBranch', 'feature/new-ui');
    setIsLoading(false);
    
    // Uncomment to use real API call
    // fetchBranches();
  }, [params.owner, params.repo, form]);

  // Handle form submission
  const onSubmit = async (values: PullRequestFormValues) => {
    setIsSaving(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the API
      const response = await fetch(`/api/repositories/${params.owner}/${params.repo}/pulls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create pull request');
      }
      
      const data = await response.json();
      
      setSuccessMessage('Pull request created successfully!');
      
      // Redirect to the PR page after a short delay
      setTimeout(() => {
        router.push(`/repositories/${params.owner}/${params.repo}/pull/${data.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating pull request:', err);
      setError('Failed to create pull request. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  // Go back to repository
  const handleCancel = () => {
    router.push(`/repositories/${params.owner}/${params.repo}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={handleCancel} />
            <h1 className="text-2xl font-bold">New Pull Request</h1>
          </div>
          
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={handleCancel} />
          <h1 className="text-2xl font-bold">New Pull Request</h1>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5" />
                  Compare branches
                </CardTitle>
                <CardDescription>
                  Select the source and target branches for your pull request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="w-full md:w-5/12">
                    <FormField
                      control={form.control}
                      name="sourceBranch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Branch</FormLabel>
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-gray-500" />
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select source branch" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {branches.map(branch => (
                                  <SelectItem key={branch} value={branch}>
                                    {branch}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="text-center my-2 md:my-0">into</div>
                  
                  <div className="w-full md:w-5/12">
                    <FormField
                      control={form.control}
                      name="targetBranch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Branch</FormLabel>
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-gray-500" />
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select target branch" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {branches.map(branch => (
                                  <SelectItem key={branch} value={branch}>
                                    {branch}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {form.formState.errors.sourceBranch && form.formState.errors.sourceBranch.message === "Source and target branches cannot be the same" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Invalid selection</AlertTitle>
                    <AlertDescription>
                      Source and target branches cannot be the same.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Git className="h-5 w-5" />
                  Pull request details
                </CardTitle>
                <CardDescription>
                  Provide information about your pull request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Pull request title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the changes in this pull request"
                          rows={6}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide details about what this pull request changes and why
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isDraft"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Create as draft pull request</FormLabel>
                        <FormDescription>
                          Draft pull requests cannot be merged until marked as ready for review
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSaving || 
                    !form.formState.isValid ||
                    form.watch("sourceBranch") === form.watch("targetBranch")
                  }
                >
                  {isSaving ? 'Creating...' : 'Create pull request'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}