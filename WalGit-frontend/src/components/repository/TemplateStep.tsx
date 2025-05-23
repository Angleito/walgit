import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { QuickStartTemplates } from '@/components/ui/tour-templates';
import { Check, Code, FileCode, Rocket } from 'lucide-react';

/**
 * Template Selection Step for the Repository Wizard
 */
const TemplateStep = memo(({ form }: { form: any }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(form.getValues().template || '');
  
  // Templates organized by category
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
      }
    ],
    move: [
      { 
        id: 'move-basic', 
        name: 'Sui Move Project', 
        description: 'Basic Sui Move smart contract project',
        features: ['Counter module', 'Unit tests', 'Deploy script'],
        recommended: true
      }
    ],
    ui: [
      { 
        id: 'react-dapp', 
        name: 'React Sui dApp', 
        description: 'React application integrated with Sui wallet',
        features: ['Wallet integration', 'Transaction hooks', 'Component library'],
        recommended: true
      }
    ]
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    form.setValue('template', templateId);
    
    // Auto-fill form values based on template
    if (templateId === 'js-basic') {
      form.setValue('name', form.getValues().name || 'js-project');
      form.setValue('description', 'JavaScript project created from template');
      form.setValue('addReadme', true);
      form.setValue('gitIgnore', 'node');
    } else if (templateId === 'move-basic') {
      form.setValue('name', form.getValues().name || 'move-contract');
      form.setValue('description', 'Sui Move smart contract project');
      form.setValue('addReadme', true);
    } else if (templateId === 'react-dapp') {
      form.setValue('name', form.getValues().name || 'sui-dapp');
      form.setValue('description', 'React application integrated with Sui wallet');
      form.setValue('addReadme', true);
      form.setValue('gitIgnore', 'node');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
        <Rocket className="w-8 h-8 mx-auto text-blue-600 mb-2" />
        <h3 className="text-lg font-medium mb-1">Start with a Template</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Choose a template to quickly set up your repository with the right files and structure.
        </p>
      </div>
      
      <Tabs defaultValue="featured">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
          <TabsTrigger value="move">Move</TabsTrigger>
          <TabsTrigger value="ui">UI</TabsTrigger>
        </TabsList>
        
        <TabsContent value="featured" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(templates).flat().filter(t => t.recommended).map(template => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:border-blue-500 ${
                  selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium flex items-center gap-2">
                      {template.id.includes('js') && <Code className="h-4 w-4 text-yellow-500" />}
                      {template.id.includes('move') && <FileCode className="h-4 w-4 text-purple-500" />}
                      {template.id.includes('react') && <Rocket className="h-4 w-4 text-blue-500" />}
                      {template.name}
                    </div>
                    {selectedTemplate === template.id && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{template.description}</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="javascript">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.javascript.map(template => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:border-blue-500 ${
                  selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium flex items-center gap-2">
                      <Code className="h-4 w-4 text-yellow-500" />
                      {template.name}
                    </div>
                    {selectedTemplate === template.id && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{template.description}</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="move">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.move.map(template => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:border-blue-500 ${
                  selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-purple-500" />
                      {template.name}
                    </div>
                    {selectedTemplate === template.id && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{template.description}</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="ui">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.ui.map(template => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:border-blue-500 ${
                  selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-blue-500" />
                      {template.name}
                    </div>
                    {selectedTemplate === template.id && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{template.description}</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex items-center justify-center pt-4">
        <Button 
          variant="ghost" 
          onClick={() => {
            form.setValue('template', '');
            setSelectedTemplate('');
          }}
          className="text-sm"
        >
          Skip template selection
        </Button>
      </div>
    </div>
  );
});

TemplateStep.displayName = 'TemplateStep';

export default TemplateStep;