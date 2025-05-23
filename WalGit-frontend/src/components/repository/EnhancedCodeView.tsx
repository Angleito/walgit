'use client';

import { useState, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import { ChevronDown, ChevronRight, Hash, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnhancedCodeViewProps {
  code: string;
  language: string;
  filename: string;
  startLineNumber?: number;
  highlightLines?: number[];
  collapsible?: boolean;
  showLineNumbers?: boolean;
  className?: string;
}

interface CodeBlock {
  startLine: number;
  endLine: number;
  content: string;
  isCollapsed: boolean;
  indentLevel: number;
}

export function EnhancedCodeView({
  code,
  language,
  filename,
  startLineNumber = 1,
  highlightLines = [],
  collapsible = true,
  showLineNumbers = true,
  className
}: EnhancedCodeViewProps) {
  const [highlightedCode, setHighlightedCode] = useState('');
  const [codeBlocks, setCodeBlocks] = useState<CodeBlock[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);

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

  // Highlight code and detect collapsible blocks
  useEffect(() => {
    const highlighted = Prism.highlight(code, Prism.languages[language] || Prism.languages.plaintext, language);
    setHighlightedCode(highlighted);

    if (collapsible) {
      const lines = code.split('\n');
      const blocks: CodeBlock[] = [];
      let currentBlock: CodeBlock | null = null;
      
      lines.forEach((line, index) => {
        const indentMatch = line.match(/^(\s*)/);
        const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / 2) : 0;
        
        // Detect block starts (functions, classes, etc.)
        const isBlockStart = /^\s*(function|class|interface|const|let|var|if|for|while|switch)/.test(line) && 
                           (line.includes('{') || lines[index + 1]?.includes('{'));
        
        if (isBlockStart && !currentBlock) {
          currentBlock = {
            startLine: index,
            endLine: index,
            content: line,
            isCollapsed: false,
            indentLevel
          };
        } else if (currentBlock) {
          currentBlock.content += '\n' + line;
          currentBlock.endLine = index;
          
          // Check for block end
          const openBraces = (currentBlock.content.match(/{/g) || []).length;
          const closeBraces = (currentBlock.content.match(/}/g) || []).length;
          
          if (openBraces === closeBraces && openBraces > 0) {
            blocks.push(currentBlock);
            currentBlock = null;
          }
        }
      });
      
      setCodeBlocks(blocks);
    }
  }, [code, language, collapsible]);

  const toggleBlock = (index: number) => {
    setCodeBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[index].isCollapsed = !newBlocks[index].isCollapsed;
      return newBlocks;
    });
  };

  const handleLineClick = (lineNumber: number) => {
    setSelectedLine(lineNumber);
    // Update URL hash
    window.location.hash = `L${lineNumber}`;
  };

  const renderLineNumbers = (lineCount: number) => {
    return Array.from({ length: lineCount }, (_, i) => {
      const lineNum = startLineNumber + i;
      const isHighlighted = highlightLines.includes(lineNum);
      const isSelected = selectedLine === lineNum;
      
      return (
        <div
          key={i}
          className={cn(
            "gh-text-secondary text-right pr-3 select-none cursor-pointer hover:text-[#f0f6fc] relative",
            isHighlighted && "bg-[#388bfd26]",
            isSelected && "bg-[#388bfd40]"
          )}
          onClick={() => handleLineClick(lineNum)}
        >
          <span className="relative">
            {lineNum}
            {isSelected && (
              <Hash className="absolute -left-5 top-0 w-4 h-4 text-[#388bfd]" />
            )}
          </span>
        </div>
      );
    });
  };

  const renderCode = () => {
    const lines = code.split('\n');
    let renderedLines = [];
    let lineIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = startLineNumber + i;
      const isHighlighted = highlightLines.includes(lineNum);
      const isSelected = selectedLine === lineNum;
      
      // Check if this line is part of a collapsible block
      const blockIndex = codeBlocks.findIndex(
        block => i >= block.startLine && i <= block.endLine
      );
      
      if (blockIndex !== -1) {
        const block = codeBlocks[blockIndex];
        
        if (i === block.startLine) {
          // Render block header
          renderedLines.push(
            <div
              key={i}
              id={`L${lineNum}`}
              className={cn(
                "flex items-center group pr-4",
                isHighlighted && "bg-[#388bfd26]",
                isSelected && "bg-[#388bfd40]"
              )}
            >
              <button
                onClick={() => toggleBlock(blockIndex)}
                className="w-5 h-5 mr-1 flex items-center justify-center text-[#8b949e] hover:text-[#f0f6fc]"
              >
                {block.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
              <code
                className="flex-1"
                dangerouslySetInnerHTML={{ 
                  __html: Prism.highlight(line, Prism.languages[language] || Prism.languages.plaintext, language)
                }}
              />
            </div>
          );
          
          if (block.isCollapsed) {
            // Show collapsed indicator
            renderedLines.push(
              <div
                key={`${i}-collapsed`}
                className="flex items-center text-[#8b949e] pl-6 pr-4 py-1 bg-[#0d1117] border-l-2 border-[#30363d]"
              >
                <span className="mr-2">...</span>
                <span className="text-sm italic">
                  {block.endLine - block.startLine} lines hidden
                </span>
              </div>
            );
            
            // Skip to end of block
            i = block.endLine;
          }
        } else if (!block.isCollapsed) {
          // Render normal line within block
          renderedLines.push(
            <div
              key={i}
              id={`L${lineNum}`}
              className={cn(
                "pr-4 pl-6",
                isHighlighted && "bg-[#388bfd26]",
                isSelected && "bg-[#388bfd40]"
              )}
            >
              <code
                dangerouslySetInnerHTML={{ 
                  __html: Prism.highlight(line, Prism.languages[language] || Prism.languages.plaintext, language)
                }}
              />
            </div>
          );
        }
      } else {
        // Render normal line
        renderedLines.push(
          <div
            key={i}
            id={`L${lineNum}`}
            className={cn(
              "pr-4",
              collapsible && "pl-6",
              isHighlighted && "bg-[#388bfd26]",
              isSelected && "bg-[#388bfd40]"
            )}
          >
            <code
              dangerouslySetInnerHTML={{ 
                __html: Prism.highlight(line, Prism.languages[language] || Prism.languages.plaintext, language)
              }}
            />
          </div>
        );
      }
    }

    return renderedLines;
  };

  // Handle hash navigation on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#L')) {
      const lineNum = parseInt(hash.substring(2));
      if (!isNaN(lineNum)) {
        setSelectedLine(lineNum);
        // Scroll to line
        setTimeout(() => {
          const element = document.getElementById(`L${lineNum}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, []);

  const lineCount = code.split('\n').length;

  return (
    <TooltipProvider>
      <div 
        ref={codeRef}
        className={cn(
          "gh-bg-canvas rounded-md border gh-border-subtle overflow-hidden",
          className
        )}
      >
        <div className="gh-bg-canvas-subtle border-b gh-border-subtle px-4 py-2 flex items-center justify-between">
          <span className="text-sm gh-text-secondary">{filename}</span>
          <div className="flex items-center gap-2 text-sm">
            <span className="gh-text-secondary">{lineCount} lines</span>
            <Tooltip>
              <TooltipTrigger>
                <Code className="w-4 h-4 gh-text-secondary" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Language: {language}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="flex min-w-full">
            {showLineNumbers && (
              <div className="flex-shrink-0 gh-bg-canvas-subtle border-r gh-border-subtle text-xs font-mono py-2">
                {renderLineNumbers(lineCount)}
              </div>
            )}
            
            <div className="flex-1 font-mono text-sm py-2 overflow-x-auto">
              <pre className="gh-text-primary">
                {renderCode()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}