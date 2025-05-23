'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import Prism from 'prismjs';
import { GitCommit, User, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface BlameLine {
  lineNumber: number;
  content: string;
  commit: {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    authorEmail: string;
    date: string;
  };
}

interface BlameViewProps {
  filePath: string;
  blameData: BlameLine[];
  language: string;
  repositoryPath: string;
  className?: string;
}

export function BlameView({
  filePath,
  blameData,
  language,
  repositoryPath,
  className
}: BlameViewProps) {
  const [highlightedLines, setHighlightedLines] = useState<{ [key: number]: string }>({});
  const [hoveredCommit, setHoveredCommit] = useState<string | null>(null);

  // Load the appropriate Prism language module
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        await import(`prismjs/components/prism-${language}`);
      } catch (e) {
        console.warn(`Language ${language} not available, using default`);
      }
    };
    loadLanguage();
  }, [language]);

  // Highlight all lines
  useEffect(() => {
    const highlighted: { [key: number]: string } = {};
    blameData.forEach((line) => {
      const code = Prism.highlight(
        line.content,
        Prism.languages[language] || Prism.languages.plaintext,
        language
      );
      highlighted[line.lineNumber] = code;
    });
    setHighlightedLines(highlighted);
  }, [blameData, language]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getCommitUrl = (hash: string) => {
    return `${repositoryPath}/commits/${hash}`;
  };

  // Group consecutive lines by commit
  const groupedBlameData = blameData.reduce((acc, line, index) => {
    const prevLine = blameData[index - 1];
    
    if (!prevLine || prevLine.commit.hash !== line.commit.hash) {
      // Start a new group
      acc.push({
        commit: line.commit,
        lines: [line]
      });
    } else {
      // Add to existing group
      acc[acc.length - 1].lines.push(line);
    }
    
    return acc;
  }, [] as Array<{ commit: BlameLine['commit'], lines: BlameLine[] }>);

  return (
    <TooltipProvider>
      <div className={cn("gh-bg-canvas rounded-md border gh-border-subtle overflow-hidden", className)}>
        <div className="gh-bg-canvas-subtle border-b gh-border-subtle px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 gh-text-secondary" />
            <span className="text-sm gh-text-secondary">Blame</span>
            <span className="text-sm font-mono gh-text-primary">{filePath}</span>
          </div>
          <span className="text-sm gh-text-secondary">
            {blameData.length} lines
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {groupedBlameData.map((group, groupIndex) => (
                <tr
                  key={groupIndex}
                  className={cn(
                    "border-b gh-border-subtle",
                    hoveredCommit === group.commit.hash && "bg-[#30363d10]"
                  )}
                  onMouseEnter={() => setHoveredCommit(group.commit.hash)}
                  onMouseLeave={() => setHoveredCommit(null)}
                >
                  {/* Commit info cell */}
                  <td className="gh-bg-canvas-subtle border-r gh-border-subtle align-top p-0">
                    {groupIndex === 0 || groupedBlameData[groupIndex - 1].commit.hash !== group.commit.hash ? (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="p-2 cursor-pointer">
                            <div className="flex items-center gap-2 text-xs">
                              <Link
                                href={getCommitUrl(group.commit.hash)}
                                className="font-mono text-[#58a6ff] hover:underline"
                              >
                                {group.commit.shortHash}
                              </Link>
                              <span className="gh-text-secondary truncate max-w-[200px]">
                                {group.commit.message}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="w-3 h-3 gh-text-secondary" />
                              <span className="text-xs gh-text-secondary">
                                {group.commit.author}
                              </span>
                              <Calendar className="w-3 h-3 gh-text-secondary" />
                              <span className="text-xs gh-text-secondary">
                                {formatDate(group.commit.date)}
                              </span>
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="gh-bg-canvas gh-border-subtle">
                          <div className="space-y-2">
                            <div>
                              <h4 className="text-sm font-semibold gh-text-primary">
                                Commit {group.commit.shortHash}
                              </h4>
                              <p className="text-sm gh-text-secondary mt-1">
                                {group.commit.message}
                              </p>
                            </div>
                            <div className="pt-2 border-t gh-border-subtle">
                              <div className="flex items-center gap-1 text-sm">
                                <User className="w-3 h-3 gh-text-secondary" />
                                <span className="gh-text-primary">{group.commit.author}</span>
                                <span className="gh-text-secondary">committed</span>
                                <span className="gh-text-primary">{formatDate(group.commit.date)}</span>
                              </div>
                            </div>
                            <div className="pt-2">
                              <Link
                                href={getCommitUrl(group.commit.hash)}
                                className="text-sm text-[#58a6ff] hover:underline"
                              >
                                View full commit →
                              </Link>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : null}
                  </td>

                  {/* Line numbers and code */}
                  <td className="p-0">
                    <table className="w-full">
                      <tbody>
                        {group.lines.map((line) => (
                          <tr key={line.lineNumber}>
                            <td className="gh-text-secondary text-right pr-3 pl-2 select-none text-xs font-mono align-top py-0.5">
                              {line.lineNumber}
                            </td>
                            <td className="gh-text-primary font-mono text-sm pr-4 py-0.5">
                              <pre>
                                <code
                                  dangerouslySetInnerHTML={{
                                    __html: highlightedLines[line.lineNumber] || line.content
                                  }}
                                />
                              </pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
}