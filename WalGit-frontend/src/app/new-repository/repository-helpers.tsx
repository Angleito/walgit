'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { QuickStartTemplates } from '@/components/ui/tour-templates';
import { ContextualHelp } from '@/components/ui/tour-templates';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import {
  HelpCircle,
  FileCode,
  HelpCircle as CircleHelp,
  LifeBuoy,
  PlayCircle,
  Zap
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
  features: string[];
  structure: { name: string; type: string; children?: { name: string; type: string }[] }[];
}

// Helper to show contextual information during repository creation
export function RepositoryTemplateSelector({ onSelect }: { onSelect: (templateId: string) => void }) {
  const [showTemplates, setShowTemplates] = useState(false);
  
  const popularTemplates: Template[] = [
    {
      id: 'js-basic',
      name: 'JavaScript Starter',
      description: 'Basic Node.js project with modern JavaScript setup',
      recommended: true,
      features: ['ESM modules', 'Jest testing', 'ESLint configuration', 'GitHub Actions CI'],
      structure: [
        { name: 'src', type: 'directory', children: [
          { name: 'index.js', type: 'file' },
          { name: 'utils.js', type: 'file' }
        ]},
        { name: 'tests', type: 'directory' },
        { name: 'README.md', type: 'file' },
        { name: 'package.json', type: 'file' },
        { name: '.gitignore', type: 'file' }
      ]
    },
    {
      id: 'move-basic',
      name: 'Sui Move Project',
      description: 'Basic Sui Move smart contract project',
      features: ['Move.toml configuration', 'Sample modules', 'Tests setup', 'Deployment scripts'],
      structure: [
        { name: 'sources', type: 'directory', children: [
          { name: 'module.move', type: 'file' }
        ]},
        { name: 'tests', type: 'directory' },
        { name: 'Move.toml', type: 'file' },
        { name: 'README.md', type: 'file' }
      ]
    }
  ];
  
  if (showTemplates) {
    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Start with a template</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
            Show basic options
          </Button>
        </div>
        
        <QuickStartTemplates onSelect={onSelect} />
      </div>
    );
  }
  
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Quick Start Options</h2>
        <Button variant="ghost" size="sm" onClick={() => setShowTemplates(true)}>
          <FileCode className="h-4 w-4 mr-2" />
          Browse all templates
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {popularTemplates.map(template => (
          <Card 
            key={template.id} 
            className={`hover:border-blue-400 transition-colors cursor-pointer ${template.recommended ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
            onClick={() => onSelect(template.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                {template.name}
                {template.recommended && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600">{template.description}</p>
            </CardHeader>
            
            <CardContent className="pb-4">
              <h4 className="text-sm font-medium mb-1">Features:</h4>
              <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                {template.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              
              <div className="mt-3">
                <h4 className="text-sm font-medium mb-1">Structure:</h4>
                <div className="border rounded p-2 max-h-24 overflow-y-auto text-xs font-mono">
                  {template.structure.map((item, i) => (
                    <div key={i} className="flex items-center">
                      <span className={`${item.type === 'directory' ? 'text-blue-600' : 'text-gray-600'}`}>
                        {item.type === 'directory' ? '📁 ' : '📄 '}
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0">
              <Button size="sm" className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                Use this template
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => onSelect('blank')}>
          Or start with an empty repository
        </Button>
      </div>
    </div>
  );
}

// Contextual help component specific to repository creation
export function RepositoryGuide() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const guideContent = [
    { 
      title: 'Choose a descriptive name',
      content: 'Use a name that clearly describes your project purpose. Avoid generic names like "test" or "project1".'
    },
    { 
      title: 'Private vs Public repositories',
      content: 'Private repositories are only visible to you and collaborators you invite. Public repositories are visible to everyone.'
    },
    { 
      title: 'Repository initialization',
      content: 'Adding a README, license and gitignore helps you get started faster. You can always add these later.'
    },
    { 
      title: 'About storage settings',
      content: 'Your repository will be stored on the Sui blockchain. Choose a storage tier based on your project size and needs.'
    }
  ];
  
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white dark:bg-gray-800 shadow-md"
          onClick={() => setIsExpanded(true)}
        >
          <LifeBuoy className="h-4 w-4 mr-2" />
          Repository Guide
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 left-4 z-40">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center">
              <CircleHelp className="h-4 w-4 mr-2 text-blue-500" />
              Repository Creation Guide
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
              <span className="sr-only">Close</span>
              &times;
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[240px] p-4">
            {guideContent.map((item, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <h3 className="text-sm font-medium mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{item.content}</p>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="border-t pt-3 pb-3">
          <Button size="sm" variant="ghost" className="w-full" onClick={() => setIsExpanded(false)}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Start Interactive Tour
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Individual help tips to provide context during repository creation
export function CreationContextHelp({ onClose, onStartTour }: { onClose: () => void; onStartTour: () => void }) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Getting Started</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            &times;
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3">
            <div className="mt-1">
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium mb-1">About Repository Names</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Choose a name that clearly describes your project. Use lowercase letters, numbers, and hyphens.
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3">
            <div className="mt-1">
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium mb-1">About Repository Storage</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your files are stored on the Sui blockchain with Walrus decentralized storage for enhanced security.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button size="sm" variant="outline" className="w-full" onClick={onStartTour}>
          <PlayCircle className="h-4 w-4 mr-2" />
          Start Interactive Tour
        </Button>
      </CardFooter>
    </Card>
  );
}