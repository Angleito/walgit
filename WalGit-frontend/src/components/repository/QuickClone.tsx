'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink,
  Info,
  GitBranch
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface QuickCloneProps {
  className?: string;
}

export function QuickClone({ className }: QuickCloneProps) {
  const [repositoryId, setRepositoryId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isValidId, setIsValidId] = useState(false);

  // Validate repository ID format
  const validateRepositoryId = (id: string) => {
    // Sui object IDs are 66 characters long and start with 0x
    const isValid = /^0x[a-fA-F0-9]{64}$/.test(id);
    setIsValidId(isValid);
    return isValid;
  };

  const handleIdChange = (value: string) => {
    setRepositoryId(value);
    validateRepositoryId(value);
  };

  const copyCloneCommand = async () => {
    if (!isValidId) return;
    
    const command = `walgit clone ${repositoryId}`;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    toast({
      title: 'Clone command copied',
      description: 'Paste this in your terminal to clone the repository'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const openInExplorer = () => {
    if (!isValidId) return;
    window.open(`https://suiexplorer.com/object/${repositoryId}`, '_blank');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Quick Clone</span>
        </CardTitle>
        <CardDescription>
          Enter a repository ID to quickly clone a WalGit repository
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="repo-id">Repository ID</Label>
          <Input
            id="repo-id"
            placeholder="0x1234567890abcdef..."
            value={repositoryId}
            onChange={(e) => handleIdChange(e.target.value)}
            className={repositoryId && !isValidId ? 'border-destructive' : ''}
          />
          {repositoryId && !isValidId && (
            <p className="text-sm text-destructive">
              Invalid repository ID format. Must be a 66-character hex string starting with 0x.
            </p>
          )}
        </div>

        {isValidId && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                Valid Repository ID
              </Badge>
            </div>

            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Clone Command</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCloneCommand}
                  className="h-6 px-2"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <code className="text-sm font-mono text-muted-foreground">
                walgit clone {repositoryId}
              </code>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={copyCloneCommand}
                className="flex-1"
                disabled={!isValidId}
              >
                <Terminal className="h-4 w-4 mr-2" />
                Copy Clone Command
              </Button>
              <Button
                variant="outline"
                onClick={openInExplorer}
                disabled={!isValidId}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Prerequisites:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>WalGit CLI installed and configured</li>
              <li>Wallet unlocked with access to the repository</li>
              <li>Sufficient permissions (Reader, Writer, or Owner)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">How to get Repository IDs:</p>
          <ul className="space-y-1 text-xs">
            <li>• Browse repositories in the <strong>Repository List</strong></li>
            <li>• Check repository pages for the <strong>Repository ID</strong> section</li>
            <li>• Use CLI: <code className="bg-muted px-1 rounded">walgit list</code></li>
            <li>• Search: <code className="bg-muted px-1 rounded">walgit search &lt;query&gt;</code></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}