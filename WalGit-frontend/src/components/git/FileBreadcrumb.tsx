'use client';

import Link from 'next/link';
import { ChevronRight, Home, Folder } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface FileBreadcrumbProps {
  repositoryPath: string;
  currentPath?: string;
  branch?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

export function FileBreadcrumb({
  repositoryPath,
  currentPath = '',
  branch = 'main',
  onNavigate,
  className
}: FileBreadcrumbProps) {
  const pathParts = currentPath.split('/').filter(Boolean);

  const handleClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <Breadcrumb className={cn("", className)}>
      <BreadcrumbList>
        {/* Repository root */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              href={`${repositoryPath}/tree/${branch}`}
              onClick={() => handleClick('')}
              className="flex items-center gap-1 text-[#8b949e] hover:text-[#f0f6fc]"
            >
              <Home size={14} />
              <span>Repository</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Path parts */}
        {pathParts.map((part, index) => {
          const isLast = index === pathParts.length - 1;
          const path = pathParts.slice(0, index + 1).join('/');

          return (
            <div key={path} className="flex items-center">
              <BreadcrumbSeparator>
                <ChevronRight size={14} className="text-[#8b949e]" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1 text-[#f0f6fc]">
                    <Folder size={14} />
                    <span>{part}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={`${repositoryPath}/tree/${branch}/${path}`}
                      onClick={() => handleClick(path)}
                      className="flex items-center gap-1 text-[#8b949e] hover:text-[#f0f6fc]"
                    >
                      <Folder size={14} />
                      <span>{part}</span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}