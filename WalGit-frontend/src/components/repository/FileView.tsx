'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Code, 
  History, 
  GitBranch,
  Download,
  Edit,
  Copy,
  Check
} from 'lucide-react';
import { EnhancedCodeView } from './EnhancedCodeView';
import { FileHistory } from './FileHistory';
import { BlameView } from './BlameView';
import { MultilevelBreadcrumb } from './MultilevelBreadcrumb';
import { cn } from '@/lib/utils';

interface FileViewProps {
  repositoryPath: string;
  branch: string;
  filePath: string;
  fileContent: string;
  language: string;
  fileSize: number;
  commits: any[]; // FileHistory commits
  blameData: any[]; // BlameView data
  className?: string;
  onEdit?: () => void;
  onDownload?: () => void;
}

export function FileView({
  repositoryPath,
  branch,
  filePath,
  fileContent,
  language,
  fileSize,
  commits,
  blameData,
  className,
  onEdit,
  onDownload
}: FileViewProps) {
  const [activeTab, setActiveTab] = useState('code');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("gh-bg-canvas", className)}>
      {/* Header */}
      <div className="gh-bg-canvas-subtle border gh-border-subtle rounded-t-md">
        <div className="px-4 py-3">
          <MultilevelBreadcrumb
            repositoryPath={repositoryPath}
            branch={branch}
            path={filePath}
          />
        </div>
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm gh-text-secondary">
            <span>{formatFileSize(fileSize)}</span>
            <span>•</span>
            <span>{fileContent.split('\n').length} lines</span>
            <span>•</span>
            <span>{language}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 px-3 gh-text-secondary hover:gh-text-primary"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="h-8 px-3 gh-text-secondary hover:gh-text-primary"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 px-3 gh-text-secondary hover:gh-text-primary"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-x border-b gh-border-subtle rounded-b-md">
          <TabsList className="bg-transparent h-auto p-0 border-b gh-border-subtle">
            <TabsTrigger 
              value="code" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#f78166] rounded-none px-4 py-2 gh-text-primary"
            >
              <Code className="w-4 h-4 mr-2" />
              Code
            </TabsTrigger>
            <TabsTrigger 
              value="blame" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#f78166] rounded-none px-4 py-2 gh-text-primary"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Blame
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#f78166] rounded-none px-4 py-2 gh-text-primary"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="m-0 p-0">
            <EnhancedCodeView
              code={fileContent}
              language={language}
              filename={filePath.split('/').pop() || ''}
              showLineNumbers={true}
              collapsible={true}
            />
          </TabsContent>

          <TabsContent value="blame" className="m-0 p-0">
            <BlameView
              filePath={filePath}
              blameData={blameData}
              language={language}
              repositoryPath={repositoryPath}
            />
          </TabsContent>

          <TabsContent value="history" className="m-0 p-0">
            <FileHistory
              filePath={filePath}
              commits={commits}
              repositoryPath={repositoryPath}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}