'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  X,
  HelpCircle,
  Code,
  Github,
  GitBranch,
  GitPullRequest,
  Settings,
  Database,
  Users,
  Rocket,
  MessageSquare,
  CheckCircle,
  PlayCircle,
  ChevronRight
} from 'lucide-react';

/**
 * Template Selection component for quick-start templates
 */
export function QuickStartTemplates({
  onSelect,
  category = 'all'
}: {
  onSelect: (template: string) => void;
  category?: 'all' | 'javascript' | 'python' | 'move' | 'ui';
}) {
  const templates = {
    javascript: [
      {
        id: 'js-basic',
        name: 'JavaScript Starter',
        description: 'Basic Node.js project with modern JavaScript setup',
        features: ['ESM modules', 'Jest testing', 'ESLint configuration'],
        recommended: true
      },
      {
        id: 'js-express',
        name: 'Express API',
        description: 'REST API with Express.js and MongoDB',
        features: ['Route handlers', 'MongoDB integration', 'Authentication']
      },
      {
        id: 'js-react',
        name: 'React App',
        description: 'React single-page application with routing',
        features: ['Component library', 'React Router', 'State management']
      },
    ],
    python: [
      {
        id: 'py-basic',
        name: 'Basic Python',
        description: 'Simple Python project with virtualenv',
        features: ['Poetry for dependencies', 'Pytest integration', 'Type hints']
      },
      {
        id: 'py-flask',
        name: 'Flask API',
        description: 'REST API with Flask and SQLAlchemy',
        features: ['REST endpoints', 'Database models', 'JWT authentication']
      },
      {
        id: 'py-django',
        name: 'Django App',
        description: 'Full-stack Django web application',
        features: ['Admin interface', 'ORM models', 'Template system'],
        recommended: true
      },
    ],
    move: [
      {
        id: 'move-basic',
        name: 'Sui Move Project',
        description: 'Basic Sui Move smart contract project',
        features: ['Counter module', 'Unit tests', 'Deploy script'],
        recommended: true
      },
      {
        id: 'move-nft',
        name: 'NFT Module',
        description: 'NFT implementation with Move on Sui',
        features: ['NFT module', 'Mint functions', 'Transfer capabilities']
      },
      {
        id: 'move-defi',
        name: 'DeFi Module',
        description: 'DeFi primitives for Sui blockchain',
        features: ['Token swapping', 'Liquidity pools', 'Staking functionality']
      },
    ],
    ui: [
      {
        id: 'react-dapp',
        name: 'React Sui dApp',
        description: 'React application integrated with Sui wallet',
        features: ['Wallet integration', 'Transaction hooks', 'Component library'],
        recommended: true
      },
      {
        id: 'ui-dashboard',
        name: 'Admin Dashboard',
        description: 'Interactive dashboard with charts and tables',
        features: ['Data visualization', 'User management', 'Analytics dashboard']
      },
      {
        id: 'ui-portfolio',
        name: 'Portfolio',
        description: 'Developer portfolio website template',
        features: ['Project showcase', 'Skills section', 'Contact form']
      },
    ]
  };

  // Get all templates or filter by category
  const filteredTemplates = category === 'all'
    ? [...templates.javascript, ...templates.python, ...templates.move, ...templates.ui]
    : templates[category];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Quick Start Templates</CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue={category === 'all' ? 'all' : category}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="move">Move</TabsTrigger>
            <TabsTrigger value="ui">UI</TabsTrigger>
          </TabsList>

          {['all', 'javascript', 'python', 'move', 'ui'].map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(cat === 'all'
                  ? [...templates.javascript, ...templates.python, ...templates.move, ...templates.ui]
                  : templates[cat as keyof typeof templates]
                ).map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all
                      ${template.recommended ? 'ring-2 ring-blue-500 ring-opacity-40' : ''}`}
                    onClick={() => onSelect(template.id)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">{template.name}</div>
                      {template.recommended && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{template.description}</p>

                    {template.features && (
                      <div className="mb-3">
                        <h4 className="text-xs font-medium text-gray-500 mb-1">Features:</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button size="sm" variant="outline" className="w-full">
                      Use Template
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Templates include README, configuration files, and basic structure
        </div>
        <Button variant="ghost" size="sm">
          <Code className="h-4 w-4 mr-2" />
          Browse More
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Contextual Help component
 */
export function ContextualHelp({
  title,
  children,
  icon = <HelpCircle className="h-5 w-5 text-blue-600" />,
  className = ''
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`relative ${className}`}>
      <button 
        className="text-blue-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle help"
      >
        {icon}
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-72 bg-white dark:bg-gray-800 shadow-lg border dark:border-gray-700 rounded-lg p-4 mt-2">
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setIsOpen(false)}
            aria-label="Close help"
          >
            <X size={16} />
          </button>
          
          <h3 className="font-medium mb-2 dark:text-white">{title}</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Pre-defined tours for different sections of the app
 */
export const predefinedTours = {
  main: [
    {
      target: '[data-tour="header-navigation"]',
      title: 'Main Navigation',
      content: 'Use the main navigation to move between different sections of the application.',
      position: 'bottom' as const,
      icon: <GitBranch className="h-5 w-5 text-blue-600" />
    },
    {
      target: '[data-tour="profile-settings"]',
      title: 'Your Profile',
      content: 'Access your profile settings, wallet information, and account preferences here.',
      position: 'bottom' as const,
      icon: <Users className="h-5 w-5 text-blue-600" />
    },
    {
      target: '[data-tour="create-repository"]',
      title: 'Create New Repository',
      content: 'Click here to create a new repository or import an existing one from GitHub.',
      position: 'right' as const,
      icon: <Github className="h-5 w-5 text-blue-600" />
    },
    {
      target: '[data-tour="repository-list"]',
      title: 'Your Repositories',
      content: 'View all your repositories and recently updated projects here.',
      position: 'top' as const,
      icon: <Database className="h-5 w-5 text-blue-600" />
    },
    {
      target: '[data-tour="theme-switcher"]',
      title: 'Customize Appearance',
      content: 'Change between light and dark modes, or customize accent colors to your preference.',
      position: 'left' as const,
      icon: <Settings className="h-5 w-5 text-blue-600" />,
      isOptional: true
    }
  ],
  repository: [
    {
      target: '[data-tour="repo-files"]',
      title: 'Repository Files',
      content: 'Browse through all files in your repository. Click on a file to view or edit its contents.',
      position: 'bottom' as const,
      icon: <Code className="h-5 w-5 text-blue-600" />
    },
    {
      target: '[data-tour="branch-selector"]',
      title: 'Branch Selection',
      content: 'Switch between branches or create a new branch to organize your development workflow.',
      position: 'bottom' as const,
      icon: <GitBranch className="h-5 w-5 text-blue-600" />
    },
    {
      target: '[data-tour="pull-requests"]',
      title: 'Pull Requests',
      content: 'Manage code reviews and collaborate with others through pull requests.',
      position: 'right' as const,
      icon: <GitPullRequest className="h-5 w-5 text-blue-600" />
    },
    {
      target: '[data-tour="storage-management"]',
      title: 'Storage Management',
      content: 'Monitor and manage your decentralized storage allocation and usage.',
      position: 'left' as const,
      icon: <Database className="h-5 w-5 text-blue-600" />
    }
  ],
  codeReview: [
    {
      target: '[data-tour="diff-view"]',
      title: 'Code Diff View',
      content: 'Review changes between versions with side-by-side or unified diff views.',
      position: 'top' as const,
      icon: <Code className="h-5 w-5 text-blue-600" />
    },
    {
      target: '[data-tour="comment-inline"]',
      title: 'Inline Comments',
      content: 'Click on a line number to add comments directly to specific lines of code.',
      position: 'right' as const,
      icon: <MessageSquare className="h-5 w-5 text-blue-600" />
    },
    {
      target: '[data-tour="approve-changes"]',
      title: 'Review Actions',
      content: 'Approve, request changes, or leave general comments on the entire pull request.',
      position: 'bottom' as const,
      icon: <CheckCircle className="h-5 w-5 text-blue-600" />
    }
  ]
};

/**
 * Interactive Tour Launcher with Tour Selection
 */
export function TourLauncher({
  onStartTour
}: {
  onStartTour: (tourName: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const tours = [
    { id: 'main', name: 'Main Interface Tour', description: 'Learn about the main navigation and features', icon: <Rocket className="h-5 w-5" /> },
    { id: 'repository', name: 'Repository Features', description: 'Explore repository management capabilities', icon: <Github className="h-5 w-5" /> },
    { id: 'codeReview', name: 'Code Review Process', description: 'Understand how to review and collaborate on code', icon: <GitPullRequest className="h-5 w-5" /> },
    { id: 'storage', name: 'Storage Management', description: 'Learn about decentralized storage features', icon: <Database className="h-5 w-5" /> },
    { id: 'settings', name: 'Profile & Settings', description: 'Customize your experience and profile', icon: <Settings className="h-5 w-5" /> }
  ];
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="fixed bottom-4 right-4 z-40 bg-white dark:bg-gray-800 shadow-md"
        onClick={() => setIsOpen(true)}
      >
        <PlayCircle className="h-4 w-4 mr-2" />
        Interactive Tours
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Interactive Tours</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Choose a guided tour to learn about different features of WalGit:
              </p>
              
              <div className="grid gap-3">
                {tours.map((tour) => (
                  <div 
                    key={tour.id}
                    className="border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all flex items-center gap-3"
                    onClick={() => {
                      onStartTour(tour.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                      {tour.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium dark:text-white">{tour.name}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{tour.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="border-t pt-4 flex justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Tours help you discover features at your own pace
              </div>
              <Button onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}