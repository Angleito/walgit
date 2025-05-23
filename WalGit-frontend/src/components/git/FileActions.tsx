'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Download, 
  History, 
  GitBranch, 
  Edit, 
  Trash2,
  Copy,
  Eye,
  FileCode
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FileActionsProps {
  filePath: string;
  repositoryPath: string;
  fileName: string;
  branch?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function FileActions({
  filePath,
  repositoryPath,
  fileName,
  branch = 'main',
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  className
}: FileActionsProps) {
  const handleDownload = () => {
    // TODO: Implement file download
    console.log('Download file:', filePath);
  };

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(filePath);
      // TODO: Show success toast
    } catch (err) {
      console.error('Failed to copy path:', err);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TooltipProvider>
        {/* Quick actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d]"
              >
                <Link href={`${repositoryPath}/blob/${branch}/${filePath}`}>
                  <Eye size={16} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
              <p>View file</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d]"
              >
                <Link href={`${repositoryPath}/blame/${branch}/${filePath}`}>
                  <GitBranch size={16} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
              <p>View blame</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d]"
              >
                <Link href={`${repositoryPath}/commits/${branch}/${filePath}`}>
                  <History size={16} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
              <p>View history</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d]"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-[#0d1117] border-[#30363d] w-48"
          >
            <DropdownMenuItem 
              onClick={handleDownload}
              className="text-[#f0f6fc] focus:bg-[#30363d] focus:text-[#f0f6fc]"
            >
              <Download size={16} className="mr-2" />
              Download
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={handleCopyPath}
              className="text-[#f0f6fc] focus:bg-[#30363d] focus:text-[#f0f6fc]"
            >
              <Copy size={16} className="mr-2" />
              Copy path
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="text-[#f0f6fc] focus:bg-[#30363d] focus:text-[#f0f6fc]">
              <Link href={`${repositoryPath}/raw/${branch}/${filePath}`}>
                <FileCode size={16} className="mr-2" />
                View raw
              </Link>
            </DropdownMenuItem>

            {(canEdit || canDelete) && (
              <>
                <DropdownMenuSeparator className="bg-[#30363d]" />
                
                {canEdit && (
                  <DropdownMenuItem 
                    onClick={onEdit}
                    className="text-[#f0f6fc] focus:bg-[#30363d] focus:text-[#f0f6fc]"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit file
                  </DropdownMenuItem>
                )}

                {canDelete && (
                  <DropdownMenuItem 
                    onClick={onDelete}
                    className="text-[#f85149] focus:bg-[#30363d] focus:text-[#f85149]"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete file
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
}