'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Terminal, Code } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CloneUrlDisplayProps {
  httpsUrl: string;
  sshUrl?: string;
  cliCommand?: string;
  className?: string;
}

export function CloneUrlDisplay({
  httpsUrl,
  sshUrl,
  cliCommand,
  className
}: CloneUrlDisplayProps) {
  const [selectedMethod, setSelectedMethod] = useState<'https' | 'ssh' | 'cli'>('https');
  const [copied, setCopied] = useState(false);

  const getUrl = () => {
    switch (selectedMethod) {
      case 'ssh':
        return sshUrl || httpsUrl;
      case 'cli':
        return cliCommand || `walgit clone ${httpsUrl}`;
      default:
        return httpsUrl;
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const methodIcon = () => {
    switch (selectedMethod) {
      case 'ssh':
        return <Terminal size={16} />;
      case 'cli':
        return <Code size={16} />;
      default:
        return <Code size={16} />;
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]"
          >
            {methodIcon()}
            <span className="ml-2 capitalize">{selectedMethod}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#0d1117] border-[#30363d]">
          <DropdownMenuItem 
            onClick={() => setSelectedMethod('https')}
            className="text-[#f0f6fc] focus:bg-[#30363d] focus:text-[#f0f6fc]"
          >
            <Code size={16} className="mr-2" />
            HTTPS
          </DropdownMenuItem>
          {sshUrl && (
            <DropdownMenuItem 
              onClick={() => setSelectedMethod('ssh')}
              className="text-[#f0f6fc] focus:bg-[#30363d] focus:text-[#f0f6fc]"
            >
              <Terminal size={16} className="mr-2" />
              SSH
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={() => setSelectedMethod('cli')}
            className="text-[#f0f6fc] focus:bg-[#30363d] focus:text-[#f0f6fc]"
          >
            <Code size={16} className="mr-2" />
            WalGit CLI
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1 flex items-center gap-2">
        <Input
          readOnly
          value={getUrl()}
          className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] font-mono text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]"
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
      </div>
    </div>
  );
}