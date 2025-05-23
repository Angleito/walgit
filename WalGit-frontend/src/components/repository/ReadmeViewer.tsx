'use client';

import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface ReadmeViewerProps {
  content: string;
  filename?: string;
  className?: string;
}

export function ReadmeViewer({ 
  content, 
  filename = 'README.md',
  className 
}: ReadmeViewerProps) {
  return (
    <Card className={cn("bg-[#0d1117] border-[#30363d]", className)}>
      <div className="border-b border-[#30363d] px-4 py-3 flex items-center gap-2">
        <FileText size={16} className="text-[#8b949e]" />
        <span className="text-sm font-medium text-[#f0f6fc]">{filename}</span>
      </div>
      <div className="p-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          className="prose prose-dark max-w-none"
          components={{
            // Custom GitHub-style markdown renderers
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-[#f0f6fc] border-b border-[#30363d] pb-3 mb-4">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold text-[#f0f6fc] border-b border-[#30363d] pb-2 mb-3 mt-6">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-bold text-[#f0f6fc] mb-2 mt-4">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-[#f0f6fc] mb-4 leading-relaxed">
                {children}
              </p>
            ),
            a: ({ href, children }) => (
              <a 
                href={href}
                className="text-[#58a6ff] hover:underline"
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            ),
            code: ({ inline, children, className }) => {
              if (inline) {
                return (
                  <code className="px-1.5 py-0.5 bg-[#161b22] text-[#ec6066] rounded text-sm font-mono">
                    {children}
                  </code>
                );
              }
              return (
                <code className={cn("block", className)}>
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-[#161b22] rounded-md p-4 overflow-x-auto mb-4">
                {children}
              </pre>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-[#f0f6fc] mb-4 ml-4 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-[#f0f6fc] mb-4 ml-4 space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-[#f0f6fc]">
                {children}
              </li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-[#30363d] pl-4 text-[#8b949e] mb-4">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="text-left px-3 py-2 border border-[#30363d] bg-[#161b22] text-[#f0f6fc] font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-3 py-2 border border-[#30363d] text-[#f0f6fc]">
                {children}
              </td>
            ),
            img: ({ src, alt }) => (
              <Image 
                src={src || ''} 
                alt={alt || ''} 
                width={800}
                height={400}
                className="max-w-full h-auto rounded-md mb-4"
              />
            ),
            hr: () => (
              <hr className="border-[#30363d] my-6" />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </Card>
  );
}