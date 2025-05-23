'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Header } from "@/components/layout/Header";
import WaveBackground from "@/components/layout/WaveBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CommitForm, CommitFormData } from "@/components/git/CommitForm";

export default function NewCommit() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock staged files for demo
  const stagedFiles = [
    {
      path: 'src/components/git/CommitForm.tsx',
      status: 'added' as const,
      additions: 156,
      deletions: 0
    },
    {
      path: 'src/app/repositories/[owner]/[repo]/commits/new/page.tsx',
      status: 'modified' as const,
      additions: 45,
      deletions: 38
    }
  ];

  const handleSubmit = async (data: CommitFormData) => {
    setIsSubmitting(true);

    try {
      // Format commit message according to conventional commit format
      let message = `${data.type}`;
      if (data.scope) {
        message += `(${data.scope})`;
      }
      message += `: ${data.message}`;
      
      let fullMessage = message;
      if (data.description) {
        fullMessage += `\n\n${data.description}`;
      }
      if (data.breaking) {
        fullMessage += `\n\nBREAKING CHANGE: ${data.message}`;
      }
      if (data.signoff) {
        fullMessage += `\n\nSigned-off-by: John Doe <john.doe@example.com>`;
      }

      // TODO: Integrate with Sui/Walrus to actually create the commit
      console.log("Creating new commit...", { message: fullMessage, staged: stagedFiles });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to repository page after successful commit
      window.location.href = `/repositories/${owner}/${repo}`;
    } catch (error) {
      console.error("Error creating commit:", error);
      // TODO: Show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50/30 to-white dark:from-dark-300 dark:to-dark-100 relative">
      <WaveBackground />
      <Header />

      <div className="container px-4 py-8 max-w-2xl mx-auto">
        <Link href={`/repositories/${owner}/${repo}`} className="inline-flex items-center text-sm text-ocean-600 hover:text-ocean-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to repository
        </Link>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Create New Commit</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{owner} / {repo}</span>
              <Badge variant="outline" className="text-xs">
                {stagedFiles.length} file{stagedFiles.length !== 1 ? 's' : ''} staged
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CommitForm
              onSubmit={handleSubmit}
              stagedFiles={stagedFiles}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}