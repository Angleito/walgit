'use client';

import { useState, memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import TemplateStep from './TemplateStep';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Github,
  GitBranch,
  File,
  Lock,
  Globe,
  Info,
  HardDrive,
  Upload,
  CheckCircle
} from 'lucide-react';

import {
  repositoryWizardSchema,
  type RepositoryWizardFormValues
} from '@/lib/form-schemas';

interface WizardProps {
  onComplete: (data: RepositoryWizardFormValues) => void;
  onCancel: () => void;
}

/**
 * Repository Creation Wizard component
 * A step-by-step guide for creating new repositories with form validation
 */
export const RepositoryWizard = memo(({ onComplete, onCancel }: WizardProps) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<RepositoryWizardFormValues>({
    resolver: zodResolver(repositoryWizardSchema),
    defaultValues: {
      name: '',
      description: '',
      visibility: 'public',
      storageSettings: 'standard',
      addReadme: true,
      defaultBranch: 'main',
      license: 'mit',
      gitIgnore: 'none',
      importType: 'new',
      importFrom: '',
      autoRenew: false,
    },
    mode: 'onChange',
  });

  // Create the step components
  const TypeStepComponent = useMemo(() => {
    const Component = ({ form }: { form: any }) => {
      // Memoize import options callbacks
      const handleGithubClick = useMemo(() => () => form.setValue("importFrom", "github"), [form]);
      const handleUrlClick = useMemo(() => () => form.setValue("importFrom", "url"), [form]);
      const handleUploadClick = useMemo(() => () => form.setValue("importFrom", "upload"), [form]);
    
      return (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="importType"
            render={({ field }) => (
              <FormItem>
                <Tabs
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new">Create new repository</TabsTrigger>
                    <TabsTrigger value="import">Import existing repository</TabsTrigger>
                  </TabsList>
    
                  <TabsContent value="new" className="pt-6">
                    <div className="text-center bg-gray-50 p-6 rounded-lg border">
                      <Plus className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                      <h3 className="text-xl font-medium mb-2">Create a New Repository</h3>
                      <p className="text-gray-600 mb-6">
                        Start fresh with a new repository on WalGit. We&apos;ll help you set everything up.
                      </p>
    
                      <div className="text-left bg-white p-4 rounded-md border">
                        <h4 className="font-medium mb-2">What you&apos;ll get:</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Decentralized storage on Sui blockchain</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Optional README, .gitignore and license setup</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>One-click repository initialization</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
    
                  <TabsContent value="import" className="pt-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="importFrom"
                        render={({ field }) => (
                          <FormItem>
                            <div
                              className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                              onClick={handleGithubClick}
                            >
                              <div className={`p-3 rounded-full ${field.value === 'github' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                <Github className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium">Import from GitHub</h3>
                                <p className="text-sm text-gray-500">Clone a GitHub repository to WalGit</p>
                              </div>
                              <div>
                                <input
                                  type="radio"
                                  checked={field.value === 'github'}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-blue-600"
                                />
                              </div>
                            </div>
    
                            <div
                              className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                              onClick={handleUrlClick}
                            >
                              <div className={`p-3 rounded-full ${field.value === 'url' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                <Globe className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium">Import from Git URL</h3>
                                <p className="text-sm text-gray-500">Clone from any git repository URL</p>
                              </div>
                              <div>
                                <input
                                  type="radio"
                                  checked={field.value === 'url'}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-blue-600"
                                />
                              </div>
                            </div>
    
                            <div
                              className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                              onClick={handleUploadClick}
                            >
                              <div className={`p-3 rounded-full ${field.value === 'upload' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                <Upload className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium">Upload Repository</h3>
                                <p className="text-sm text-gray-500">Upload a local .git repository</p>
                              </div>
                              <div>
                                <input
                                  type="radio"
                                  checked={field.value === 'upload'}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-blue-600"
                                />
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
    
                      {form.watch("importFrom") === 'github' && (
                        <Alert className="mt-4">
                          <Info className="w-4 h-4" />
                          <AlertTitle>GitHub Integration</AlertTitle>
                          <AlertDescription>
                            You&apos;ll need to authorize WalGit to access your GitHub repositories.
                          </AlertDescription>
                        </Alert>
                      )}
    
                      {form.watch("importFrom") === 'url' && (
                        <FormField
                          control={form.control}
                          name="repoUrl"
                          render={({ field }) => (
                            <FormItem className="mt-4 space-y-2">
                              <FormLabel htmlFor="repoUrl">Repository URL</FormLabel>
                              <FormControl>
                                <Input
                                  id="repoUrl"
                                  placeholder="https://github.com/username/repository.git"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </FormItem>
            )}
          />
        </div>
      );
    };
    return memo(Component);
  }, []);

  const DetailsStepComponent = useMemo(() => {
    const Component = ({ form }: { form: any }) => {
      return (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="name">Repository Name *</FormLabel>
                <FormControl>
                  <Input
                    id="name"
                    placeholder="my-awesome-project"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Choose a clear, descriptive name. Must be at least 3 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
    
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="description">Description (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    id="description"
                    placeholder="Describe your repository..."
                    rows={3}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  A good description helps others understand your project.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
    
          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Visibility</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <FormLabel htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                        <Globe className="w-4 h-4" />
                        <span>Public</span>
                        <span className="text-xs text-gray-500">(Anyone can see this repository)</span>
                      </FormLabel>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <FormLabel htmlFor="private" className="flex items-center gap-2 cursor-pointer">
                        <Lock className="w-4 h-4" />
                        <span>Private</span>
                        <span className="text-xs text-gray-500">(Only you and collaborators can see this repository)</span>
                      </FormLabel>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    };
    return memo(Component);
  }, []);

  const StorageStepComponent = useMemo(() => {
    const Component = ({ form }: { form: any }) => {
      return (
        <div className="space-y-6">
          <div className="text-center bg-blue-50 p-4 mb-4 rounded-md">
            <HardDrive className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <h3 className="font-medium">Choose Storage Settings</h3>
            <p className="text-sm text-gray-600">
              Your repository will be stored on the Sui blockchain using WalGit&apos;s decentralized storage.
            </p>
          </div>
    
          <FormField
            control={form.control}
            name="storageSettings"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="space-y-4"
                  >
                    <div className={`border p-4 rounded-lg relative ${field.value === 'basic' ? 'border-blue-500 bg-blue-50' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="basic" id="basic" />
                        <div className="flex-1">
                          <FormLabel htmlFor="basic" className="font-medium cursor-pointer">Basic (1 SUI)</FormLabel>
                          <p className="text-sm text-gray-600 mt-1">100 MB storage for 30 days</p>
                        </div>
                      </div>
                    </div>
    
                    <div className={`border p-4 rounded-lg relative ${field.value === 'standard' ? 'border-blue-500 bg-blue-50' : ''}`}>
                      <div className="absolute -top-2 left-4 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">RECOMMENDED</div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="standard" id="standard" />
                        <div className="flex-1">
                          <FormLabel htmlFor="standard" className="font-medium cursor-pointer">Standard (5 SUI)</FormLabel>
                          <p className="text-sm text-gray-600 mt-1">1 GB storage for 180 days</p>
                        </div>
                      </div>
                    </div>
    
                    <div className={`border p-4 rounded-lg relative ${field.value === 'premium' ? 'border-blue-500 bg-blue-50' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="premium" id="premium" />
                        <div className="flex-1">
                          <FormLabel htmlFor="premium" className="font-medium cursor-pointer">Premium (20 SUI)</FormLabel>
                          <p className="text-sm text-gray-600 mt-1">10 GB storage for 365 days</p>
                        </div>
                      </div>
                    </div>
    
                    <div className={`border p-4 rounded-lg relative ${field.value === 'custom' ? 'border-blue-500 bg-blue-50' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom" />
                        <div className="flex-1">
                          <FormLabel htmlFor="custom" className="font-medium cursor-pointer">Custom</FormLabel>
                          <p className="text-sm text-gray-600 mt-1">Configure your own storage settings</p>
                        </div>
                      </div>
    
                      {field.value === 'custom' && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="customStorage.size"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel htmlFor="storageSize">Storage Size</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  defaultValue="5"
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="1">1 GB</SelectItem>
                                    <SelectItem value="2">2 GB</SelectItem>
                                    <SelectItem value="5">5 GB</SelectItem>
                                    <SelectItem value="10">10 GB</SelectItem>
                                    <SelectItem value="20">20 GB</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
    
                          <FormField
                            control={form.control}
                            name="customStorage.duration"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel htmlFor="storageDuration">Duration</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  defaultValue="180"
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="30">30 days</SelectItem>
                                    <SelectItem value="90">90 days</SelectItem>
                                    <SelectItem value="180">180 days</SelectItem>
                                    <SelectItem value="365">365 days</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
    
          <FormField
            control={form.control}
            name="autoRenew"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 pt-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm">
                    Enable auto-renewal to prevent data loss
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
      );
    };
    return memo(Component);
  }, []);

  const SettingsStepComponent = useMemo(() => {
    const Component = ({ form }: { form: any }) => {
      return (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="defaultBranch"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="defaultBranch">Default Branch</FormLabel>
                <div className="flex gap-2">
                  <div className="bg-gray-100 p-2 rounded flex items-center">
                    <GitBranch className="w-4 h-4 text-gray-500" />
                  </div>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="main">main</SelectItem>
                      <SelectItem value="master">master</SelectItem>
                      <SelectItem value="development">development</SelectItem>
                      <SelectItem value="production">production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
    
          <FormField
            control={form.control}
            name="addReadme"
            render={({ field }) => (
              <FormItem className="flex items-start space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-medium cursor-pointer">
                    Add a README file
                  </FormLabel>
                  <FormDescription className="text-sm text-gray-500">
                    This will create a README.md file with basic information about your repository.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
    
          <FormField
            control={form.control}
            name="license"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="license">Add a license</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select license" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="mit">MIT License</SelectItem>
                    <SelectItem value="apache">Apache License 2.0</SelectItem>
                    <SelectItem value="gpl">GNU General Public License v3.0</SelectItem>
                    <SelectItem value="bsd">BSD 3-Clause License</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  A license tells others what they can and cannot do with your code.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
    
          <FormField
            control={form.control}
            name="gitIgnore"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="gitIgnore">Add .gitignore template</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="node">Node</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose which files not to track in your repository.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    };
    return memo(Component);
  }, []);

  const ReviewStepComponent = useMemo(() => {
    const Component = ({ form }: { form: any }) => {
      // Note: Using useMemo for formValues would cause issues since form data can change
      // Instead, we use the form's getValues method directly
      const formValues = form.getValues();
    
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Repository Summary</h3>
            <p className="text-sm">
              Please review your repository settings before creating.
            </p>
          </div>
    
          <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 font-medium border-b">
              Basic Details
            </div>
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">Name:</div>
                <div className="text-sm font-medium">{formValues.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">Description:</div>
                <div className="text-sm">{formValues.description || '—'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">Visibility:</div>
                <div className="text-sm font-medium flex items-center gap-1">
                  {formValues.visibility === 'public' ? (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Private</span>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">Template:</div>
                <div className="text-sm">
                  {formValues.template ? (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {formValues.template}
                    </span>
                  ) : '—'}
                </div>
              </div>
            </div>
          </div>
    
          <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 font-medium border-b">
              Storage Settings
            </div>
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">Plan:</div>
                <div className="text-sm font-medium">
                  {formValues.storageSettings === 'basic' ? 'Basic' :
                   formValues.storageSettings === 'standard' ? 'Standard' :
                   formValues.storageSettings === 'premium' ? 'Premium' : 'Custom'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">Storage:</div>
                <div className="text-sm">
                  {formValues.storageSettings === 'basic' ? '100 MB' :
                   formValues.storageSettings === 'standard' ? '1 GB' :
                   formValues.storageSettings === 'premium' ? '10 GB' :
                   formValues.customStorage?.size ? `${formValues.customStorage.size} GB` : 'Custom size'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">Duration:</div>
                <div className="text-sm">
                  {formValues.storageSettings === 'basic' ? '30 days' :
                   formValues.storageSettings === 'standard' ? '180 days' :
                   formValues.storageSettings === 'premium' ? '365 days' :
                   formValues.customStorage?.duration ? `${formValues.customStorage.duration} days` : 'Custom duration'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">Auto-renew:</div>
                <div className="text-sm">{formValues.autoRenew ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
          </div>
    
          <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 font-medium border-b">
              Initialization
            </div>
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">Default Branch:</div>
                <div className="text-sm">{formValues.defaultBranch}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">README:</div>
                <div className="text-sm">{formValues.addReadme ? 'Yes' : 'No'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">License:</div>
                <div className="text-sm">
                  {formValues.license === 'none' ? 'None' :
                   formValues.license === 'mit' ? 'MIT License' :
                   formValues.license === 'apache' ? 'Apache License 2.0' :
                   formValues.license === 'gpl' ? 'GNU GPL v3.0' :
                   'BSD 3-Clause License'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">.gitignore:</div>
                <div className="text-sm">
                  {formValues.gitIgnore === 'none' ? 'None' :
                   formValues.gitIgnore.charAt(0).toUpperCase() + formValues.gitIgnore.slice(1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };
    return memo(Component);
  }, []);

  // Steps in the wizard - memoized to prevent unnecessary re-renders
  const steps = useMemo(() => [
    {
      id: 'type',
      title: 'Repository Type',
      component: <TypeStepComponent form={form} />
    },
    {
      id: 'template',
      title: 'Choose Template',
      component: <TemplateStep form={form} />
    },
    {
      id: 'details',
      title: 'Repository Details',
      component: <DetailsStepComponent form={form} />
    },
    {
      id: 'storage',
      title: 'Storage Settings',
      component: <StorageStepComponent form={form} />
    },
    {
      id: 'settings',
      title: 'Initialize Settings',
      component: <SettingsStepComponent form={form} />
    },
    {
      id: 'review',
      title: 'Review & Create',
      component: <ReviewStepComponent form={form} />
    }
  ], [form, TypeStepComponent, DetailsStepComponent, StorageStepComponent, SettingsStepComponent, ReviewStepComponent]);

  // Validate current step - memoized to optimize performance
  const isCurrentStepValid = useMemo(() => {
    const currentValues = form.getValues();

    switch (currentStep) {
      case 0: // Type step
        return true; // This step is always valid
      case 1: // Template step
        return true; // Template selection is optional
      case 2: // Details step
        return !!currentValues.name && currentValues.name.length >= 3;
      case 3: // Storage step
        return !!currentValues.storageSettings;
      case 4: // Settings step
        return true; // This step is always valid
      case 5: // Review step
        return true; // This step is always valid
      default:
        return false;
    }
  }, [currentStep, form]);

  // Complete the wizard
  const handleComplete = async () => {
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show success screen
      setShowSuccessScreen(true);

      // In a real implementation, redirect to the new repository
      setTimeout(() => {
        onComplete(form.getValues());
      }, 1500);
    } catch (error) {
      console.error('Error creating repository:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Go to next step - memoized callback
  const goToNextStep = useMemo(() => () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  // Go to previous step - memoized callback
  const goToPrevStep = useMemo(() => () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  // If showing success screen
  if (showSuccessScreen) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-xl mx-4 animate-fadeIn">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Repository Created!</CardTitle>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="mb-6">
              Your new repository <span className="font-bold">{form.getValues().name}</span> has been successfully created.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-md inline-block mx-auto">
              <p className="text-sm text-gray-700">Clone your repository with:</p>
              <pre className="bg-black text-white p-3 rounded mt-2 text-sm overflow-x-auto">
                git clone https://walgit.io/user/{form.getValues().name}.git
              </pre>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center gap-4">
            <Button variant="outline" onClick={onCancel}>
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push(`/repositories/user/${form.getValues().name}`)}>
              Go to Repository
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl mx-4">
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="flex gap-1">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`w-10 h-1 rounded-full ${
                    index === currentStep 
                      ? 'bg-blue-500' 
                      : index < currentStep 
                        ? 'bg-green-500' 
                        : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            {steps[currentStep].component}
          </Form>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <div>
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={goToPrevStep}
                disabled={isLoading}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button 
              onClick={goToNextStep}
              disabled={!isCurrentStepValid || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : currentStep === steps.length - 1 ? (
                'Create Repository'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
});

RepositoryWizard.displayName = 'RepositoryWizard';

export default RepositoryWizard;