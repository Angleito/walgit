'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FileActions } from './FileActions';
import { FileBreadcrumb } from './FileBreadcrumb';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  FileCode, 
  Download, 
  Copy, 
  Check,
  Eye,
  Code
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FileViewerProps {
  filePath: string;
  fileName: string;
  fileContent: string;
  language?: string;
  repositoryPath: string;
  branch?: string;
  fileSize?: number;
  lastCommit?: {
    message: string;
    author: string;
    date: string;
    hash: string;
  };
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function FileViewer({
  filePath,
  fileName,
  fileContent,
  language,
  repositoryPath,
  branch = 'main',
  fileSize,
  lastCommit,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  className
}: FileViewerProps) {
  const [viewMode, setViewMode] = useState<'source' | 'preview'>('source');
  const [copied, setCopied] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    setLines(fileContent.split('\n'));
  }, [fileContent]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const isMarkdown = fileName.endsWith('.md') || fileName.endsWith('.markdown');
  const isImage = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(fileName);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Breadcrumb */}
      <FileBreadcrumb
        repositoryPath={repositoryPath}
        currentPath={filePath}
        branch={branch}
      />

      {/* File header */}
      <Card className="bg-[#0d1117] border-[#30363d]">
        <div className="p-4 border-b border-[#30363d]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode size={20} className="text-[#8b949e]" />
              <h2 className="text-lg font-medium text-[#f0f6fc]">{fileName}</h2>
              {fileSize && (
                <span className="text-sm text-[#8b949e]">
                  {formatFileSize(fileSize)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isMarkdown && (
                <div className="flex items-center rounded-md border border-[#30363d] p-0.5">
                  <Button
                    variant={viewMode === 'source' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('source')}
                    className="h-7 px-3 text-xs"
                  >
                    <Code size={14} className="mr-1" />
                    Source
                  </Button>
                  <Button
                    variant={viewMode === 'preview' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('preview')}
                    className="h-7 px-3 text-xs"
                  >
                    <Eye size={14} className="mr-1" />
                    Preview
                  </Button>
                </div>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className="h-8 px-3 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d]"
                    >
                      {copied ? (
                        <>
                          <Check size={16} className="mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={16} className="mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
                    <p>Copy file content</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d]"
                    >
                      <Download size={16} className="mr-1" />
                      Download
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
                    <p>Download file</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <FileActions
                filePath={filePath}
                repositoryPath={repositoryPath}
                fileName={fileName}
                branch={branch}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </div>

          {lastCommit && (
            <div className="mt-3 text-sm text-[#8b949e]">
              <span className="font-mono">{lastCommit.hash.substring(0, 7)}</span>
              <span className="mx-2">•</span>
              <span>{lastCommit.message}</span>
              <span className="mx-2">•</span>
              <span>{lastCommit.author}</span>
            </div>
          )}
        </div>

        {/* File content */}
        <div className="overflow-auto">
          {isImage ? (
            <div className="p-8 text-center">
              <Image 
                src={fileContent} 
                alt={fileName}
                width={800}
                height={600}
                className="max-w-full mx-auto"
              />
            </div>
          ) : viewMode === 'preview' && isMarkdown ? (
            <div className="p-6 prose prose-invert max-w-none">
              {/* TODO: Render markdown content */}
              <p className="text-[#8b949e]">Markdown preview not implemented yet</p>
            </div>
          ) : (
            <div className="flex">
              <div className="flex-shrink-0 select-none bg-[#0d1117] border-r border-[#30363d] text-[#8b949e] text-sm">
                {lines.map((_, index) => (
                  <div key={index} className="px-3 py-0.5 text-right">
                    {index + 1}
                  </div>
                ))}
              </div>
              <div className="flex-1 overflow-x-auto">
                <pre className="p-0 m-0 bg-transparent">
                  <code className={cn("block text-sm text-[#f0f6fc]", language && `language-${language}`)}>
                    {lines.map((line, index) => (
                      <div key={index} className="px-4 py-0.5 hover:bg-[#161b22]">
                        {line || '\u00A0'}
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}