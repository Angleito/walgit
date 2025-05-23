'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { ChevronRight, Folder, FileCode, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
}

interface MultilevelBreadcrumbProps {
  repositoryPath: string;
  branch: string;
  path: string;
  className?: string;
  maxVisibleItems?: number;
}

export function MultilevelBreadcrumb({
  repositoryPath,
  branch,
  path,
  className,
  maxVisibleItems = 3
}: MultilevelBreadcrumbProps) {
  const pathSegments = path.split('/').filter(Boolean);
  
  // Create breadcrumb items from path segments
  const items: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const itemPath = pathSegments.slice(0, index + 1).join('/');
    const isLast = index === pathSegments.length - 1;
    
    return {
      name: segment,
      path: itemPath,
      type: isLast && segment.includes('.') ? 'file' : 'directory'
    };
  });

  // Add repository root
  const allItems = [
    { name: 'Repository', path: '', type: 'directory' as const },
    ...items
  ];

  // Determine which items to show and which to collapse
  let visibleItems = allItems;
  let collapsedItems: typeof allItems = [];
  
  if (allItems.length > maxVisibleItems + 1) {
    visibleItems = [
      allItems[0], // Always show root
      ...allItems.slice(-(maxVisibleItems - 1)) // Show last few items
    ];
    collapsedItems = allItems.slice(1, -(maxVisibleItems - 1));
  }

  const getItemUrl = (item: BreadcrumbItem) => {
    if (item.path === '') {
      return `${repositoryPath}?branch=${branch}`;
    }
    return item.type === 'file' 
      ? `${repositoryPath}/blob/${branch}/${item.path}`
      : `${repositoryPath}/tree/${branch}/${item.path}`;
  };

  const getItemIcon = (item: BreadcrumbItem) => {
    if (item.path === '') return <Home className="w-4 h-4" />;
    return item.type === 'file' 
      ? <FileCode className="w-4 h-4" />
      : <Folder className="w-4 h-4" />;
  };

  return (
    <nav className={cn("flex items-center", className)} aria-label="Breadcrumb">
      <ol className="flex items-center">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const showDropdown = index === 1 && collapsedItems.length > 0;

          return (
            <Fragment key={item.path || 'root'}>
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-1 gh-text-secondary" />
              )}

              {showDropdown ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 gh-text-primary hover:bg-[#30363d]"
                    >
                      <span className="text-sm">...</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="gh-bg-canvas gh-border-subtle"
                  >
                    {collapsedItems.map((collapsedItem) => (
                      <DropdownMenuItem key={collapsedItem.path} asChild>
                        <Link
                          href={getItemUrl(collapsedItem)}
                          className="flex items-center gap-2 gh-text-primary hover:bg-[#30363d]"
                        >
                          {getItemIcon(collapsedItem)}
                          <span>{collapsedItem.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <li className="flex items-center">
                  {isLast ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium gh-text-primary">
                      {getItemIcon(item)}
                      <span>{item.name}</span>
                    </span>
                  ) : (
                    <Link
                      href={getItemUrl(item)}
                      className="flex items-center gap-1.5 text-sm gh-text-primary hover:text-[#58a6ff] hover:underline"
                    >
                      {getItemIcon(item)}
                      <span>{item.name}</span>
                    </Link>
                  )}
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}