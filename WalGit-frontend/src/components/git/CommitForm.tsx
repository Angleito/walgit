'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GitCommit, 
  AlertCircle, 
  Info,
  HelpCircle 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Conventional commit types
const COMMIT_TYPES = [
  { value: 'feat', label: 'feat', description: 'A new feature' },
  { value: 'fix', label: 'fix', description: 'A bug fix' },
  { value: 'docs', label: 'docs', description: 'Documentation only changes' },
  { value: 'style', label: 'style', description: 'Changes that do not affect the meaning of the code' },
  { value: 'refactor', label: 'refactor', description: 'A code change that neither fixes a bug nor adds a feature' },
  { value: 'perf', label: 'perf', description: 'A code change that improves performance' },
  { value: 'test', label: 'test', description: 'Adding missing tests or correcting existing tests' },
  { value: 'build', label: 'build', description: 'Changes that affect the build system or external dependencies' },
  { value: 'ci', label: 'ci', description: 'Changes to CI configuration files and scripts' },
  { value: 'chore', label: 'chore', description: 'Other changes that don\'t modify src or test files' },
];

interface CommitFormProps {
  onSubmit: (data: CommitFormData) => void;
  isSubmitting?: boolean;
  stagedFiles?: string[];
  amendMode?: boolean;
  existingCommit?: {
    type?: string;
    scope?: string;
    message: string;
    description?: string;
    breaking?: boolean;
  };
  className?: string;
}

export interface CommitFormData {
  type: string;
  scope?: string;
  message: string;
  description?: string;
  breaking: boolean;
  amendCommit: boolean;
  signoff: boolean;
}

export function CommitForm({
  onSubmit,
  isSubmitting = false,
  stagedFiles = [],
  amendMode = false,
  existingCommit,
  className
}: CommitFormProps) {
  const [type, setType] = useState(existingCommit?.type || '');
  const [scope, setScope] = useState(existingCommit?.scope || '');
  const [message, setMessage] = useState(existingCommit?.message || '');
  const [description, setDescription] = useState(existingCommit?.description || '');
  const [breaking, setBreaking] = useState(existingCommit?.breaking || false);
  const [amendCommit, setAmendCommit] = useState(amendMode);
  const [signoff, setSignoff] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Generate the full commit message
  const fullMessage = useEffect(() => {
    let msg = '';
    if (type && message) {
      msg = type;
      if (scope) {
        msg += `(${scope})`;
      }
      if (breaking) {
        msg += '!';
      }
      msg += `: ${message}`;
    }
    return msg;
  }, [type, scope, message, breaking]);

  const getCommitMessage = () => {
    let msg = '';
    if (type && message) {
      msg = type;
      if (scope) {
        msg += `(${scope})`;
      }
      if (breaking) {
        msg += '!';
      }
      msg += `: ${message}`;
    }
    return msg;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: CommitFormData = {
      type,
      scope: scope || undefined,
      message,
      description: description || undefined,
      breaking,
      amendCommit,
      signoff,
    };

    onSubmit(formData);
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    // Focus on message input after selecting type
    const messageInput = document.getElementById('commit-message');
    if (messageInput) {
      messageInput.focus();
    }
  };

  return (
    <Card className={cn("bg-[#0d1117] border-[#30363d]", className)}>
      <CardHeader>
        <CardTitle className="text-[#f0f6fc] flex items-center gap-2">
          <GitCommit size={20} />
          {amendCommit ? 'Amend Commit' : 'Create Commit'}
        </CardTitle>
        <CardDescription className="text-[#8b949e]">
          Use conventional commit format for better organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Conventional commit type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="commit-type" className="text-[#f0f6fc]">
                Type <span className="text-[#f85149]">*</span>
              </Label>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger
                  id="commit-type"
                  className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc]"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1117] border-[#30363d]">
                  {COMMIT_TYPES.map((commitType) => (
                    <SelectItem
                      key={commitType.value}
                      value={commitType.value}
                      className="text-[#f0f6fc] focus:bg-[#30363d] focus:text-[#f0f6fc]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{commitType.label}</span>
                        <span className="text-[#8b949e] text-xs">
                          {commitType.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="commit-scope" className="text-[#f0f6fc]">
                Scope (optional)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle size={14} className="inline ml-1 text-[#8b949e]" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
                      <p>Component or area affected (e.g., api, ui, auth)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="commit-scope"
                placeholder="component"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] placeholder:text-[#8b949e]"
              />
            </div>
          </div>

          {/* Summary message */}
          <div>
            <Label htmlFor="commit-message" className="text-[#f0f6fc]">
              Summary <span className="text-[#f85149]">*</span>
            </Label>
            <Input
              id="commit-message"
              placeholder="add user authentication"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] placeholder:text-[#8b949e]"
            />
            <p className="text-xs text-[#8b949e] mt-1">
              Keep it short and imperative mood (e.g., &quot;add&quot; not &quot;adds&quot; or &quot;added&quot;)
            </p>
          </div>

          {/* Detailed description */}
          <div>
            <Label htmlFor="commit-description" className="text-[#f0f6fc]">
              Description (optional)
            </Label>
            <Textarea
              id="commit-description"
              placeholder="Detailed explanation of what and why..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] placeholder:text-[#8b949e]"
            />
          </div>

          {/* Staged files summary */}
          {stagedFiles.length > 0 && (
            <div>
              <Label className="text-[#f0f6fc] mb-2 block">
                Staged Files ({stagedFiles.length})
              </Label>
              <div className="bg-[#161b22] border border-[#30363d] rounded-md p-3 max-h-32 overflow-auto">
                {stagedFiles.map((file) => (
                  <div key={file} className="text-sm text-[#8b949e] py-0.5">
                    {file}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="breaking-change"
                checked={breaking}
                onCheckedChange={(checked) => setBreaking(!!checked)}
                className="border-[#30363d] data-[state=checked]:bg-[#1f6feb] data-[state=checked]:border-[#1f6feb]"
              />
              <Label
                htmlFor="breaking-change"
                className="text-sm text-[#f0f6fc] cursor-pointer"
              >
                Breaking change
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle size={14} className="inline ml-1 text-[#f9826c]" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
                      <p>This change breaks backward compatibility</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
            </div>

            {amendMode && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="amend-commit"
                  checked={amendCommit}
                  onCheckedChange={(checked) => setAmendCommit(!!checked)}
                  className="border-[#30363d] data-[state=checked]:bg-[#1f6feb] data-[state=checked]:border-[#1f6feb]"
                />
                <Label
                  htmlFor="amend-commit"
                  className="text-sm text-[#f0f6fc] cursor-pointer"
                >
                  Amend previous commit
                </Label>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="signoff"
                checked={signoff}
                onCheckedChange={(checked) => setSignoff(!!checked)}
                className="border-[#30363d] data-[state=checked]:bg-[#1f6feb] data-[state=checked]:border-[#1f6feb]"
              />
              <Label
                htmlFor="signoff"
                className="text-sm text-[#f0f6fc] cursor-pointer"
              >
                Sign-off commit
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="inline ml-1 text-[#8b949e]" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
                      <p>Add Signed-off-by line at the end of commit message</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
            </div>
          </div>

          {/* Commit preview */}
          {type && message && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#f0f6fc]">Commit Preview</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-[#8b949e] hover:text-[#f0f6fc] h-6"
                >
                  {showPreview ? 'Hide' : 'Show'}
                </Button>
              </div>
              {showPreview && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-md p-3 font-mono text-sm">
                  <div className="text-[#f0f6fc]">{getCommitMessage()}</div>
                  {description && (
                    <>
                      <div className="h-2" />
                      <div className="text-[#8b949e] whitespace-pre-wrap">
                        {description}
                      </div>
                    </>
                  )}
                  {breaking && (
                    <>
                      <div className="h-2" />
                      <div className="text-[#f85149]">BREAKING CHANGE: </div>
                    </>
                  )}
                  {signoff && (
                    <>
                      <div className="h-2" />
                      <div className="text-[#8b949e]">
                        Signed-off-by: Your Name &lt;your.email@example.com&gt;
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit button */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="default"
              disabled={!type || !message || isSubmitting}
              className="bg-[#238636] text-white hover:bg-[#2ea043]"
            >
              {isSubmitting ? 'Creating commit...' : 'Commit changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}