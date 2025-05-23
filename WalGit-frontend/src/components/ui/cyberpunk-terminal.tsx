'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Moon, Sun, X, Minus, Maximize, Terminal } from 'lucide-react';
import Prism from 'prismjs';
// Import necessary language support
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-toml';

interface CyberpunkTerminalProps {
  code?: string;
  language?: string;
  title?: string;
  typingSpeed?: number;
  showLineNumbers?: boolean;
  className?: string;
  darkMode?: boolean;
  onThemeToggle?: () => void;
  animateTyping?: boolean;
}

/**
 * CyberpunkTerminal component that displays code in a retro terminal-like interface
 * with scanlines, typing animation, and syntax highlighting
 */
export function CyberpunkTerminal({
  code = '',
  language = 'javascript',
  title = 'terminal@walgit:~$',
  typingSpeed = 20,
  showLineNumbers = true,
  className,
  darkMode = true,
  onThemeToggle,
  animateTyping = true,
}: CyberpunkTerminalProps) {
  const [displayedCode, setDisplayedCode] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<number>(0);
  
  // Initialize isTyping based on animateTyping prop
  useEffect(() => {
    setIsTyping(animateTyping);
  }, [animateTyping]);
  
  // Detect language for syntax highlighting
  const detectLanguage = (lang: string, code: string): string => {
    if (lang && Prism.languages[lang]) return lang;
    
    // Try to auto-detect from file extension in first line
    const firstLine = code.split('\n')[0];
    const fileExtensionMatch = firstLine.match(/\.([a-zA-Z0-9]+)$/);
    
    if (fileExtensionMatch) {
      const extension = fileExtensionMatch[1].toLowerCase();
      const extensionMap: Record<string, string> = {
        'js': 'javascript',
        'jsx': 'jsx',
        'ts': 'typescript',
        'tsx': 'tsx',
        'css': 'css',
        'html': 'html',
        'rs': 'rust',
        'py': 'python',
        'java': 'java',
        'go': 'go',
        'c': 'c',
        'cpp': 'cpp',
        'h': 'c',
        'hpp': 'cpp',
        'md': 'markdown',
        'json': 'json',
        'yml': 'yaml',
        'yaml': 'yaml',
        'sh': 'bash',
        'bash': 'bash',
        'sql': 'sql',
        'toml': 'toml',
        'move': 'rust' // Use Rust highlighting for Move files
      };
      
      if (extensionMap[extension]) return extensionMap[extension];
    }
    
    return 'javascript'; // Default
  };
  
  // Apply syntax highlighting
  const applySyntaxHighlighting = (code: string, lang: string): string => {
    try {
      const detectedLang = detectLanguage(lang, code);
      const grammar = Prism.languages[detectedLang];
      
      if (!grammar) return code;
      
      return Prism.highlight(code, grammar, detectedLang);
    } catch (error) {
      console.error('Error applying syntax highlighting:', error);
      return code;
    }
  };
  
  // Handle typing animation
  useEffect(() => {
    // Reset position when code changes
    positionRef.current = 0;
    
    if (!animateTyping) {
      setDisplayedCode(code);
      setIsTyping(false);
      return;
    }
    
    if (!isTyping) return;
    
    const codeLength = code.length;
    
    const typingInterval = setInterval(() => {
      if (positionRef.current < codeLength) {
        // Add the next character to displayed code
        const newPosition = positionRef.current + 1;
        setDisplayedCode(code.substring(0, newPosition));
        positionRef.current = newPosition;
      } else {
        // End the typing animation
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, typingSpeed);
    
    return () => clearInterval(typingInterval);
  }, [code, isTyping, typingSpeed, animateTyping]);
  
  // Handle blinking cursor
  useEffect(() => {
    if (isTyping) return; // Keep cursor visible while typing
    
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530); // Cursor blink speed
    
    return () => clearInterval(cursorInterval);
  }, [isTyping]);
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };
  
  // Generate highlighted code with line numbers
  const generateDisplayCode = () => {
    const highlighted = applySyntaxHighlighting(displayedCode, language);
    
    if (!showLineNumbers) {
      return (
        <div 
          className="terminal-code" 
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      );
    }
    
    const lines = displayedCode.split('\n');
    const highlightedLines = highlighted.split('\n');
    
    return (
      <table className="terminal-code-table">
        <tbody>
          {lines.map((_, i) => (
            <tr key={i} className="terminal-line">
              <td className="terminal-line-number">{i + 1}</td>
              <td 
                className="terminal-line-content"
                dangerouslySetInnerHTML={{ 
                  __html: (highlightedLines[i] || '') + (i === lines.length - 1 && isTyping ? '<span class="terminal-cursor">█</span>' : '') 
                }}
              />
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        'cyberpunk-terminal',
        darkMode ? 'cyberpunk-terminal-dark' : 'cyberpunk-terminal-light',
        isFullscreen ? 'cyberpunk-terminal-fullscreen' : '',
        className
      )}
    >
      {/* Terminal header */}
      <div className="terminal-header">
        <div className="terminal-title">
          <Terminal className="terminal-icon" />
          <span>{title}</span>
        </div>
        <div className="terminal-controls">
          {onThemeToggle && (
            <button 
              className="terminal-button terminal-theme-button" 
              onClick={onThemeToggle}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="terminal-button-icon" /> : <Moon className="terminal-button-icon" />}
            </button>
          )}
          <button 
            className="terminal-button terminal-minimize" 
            aria-label="Minimize"
          >
            <Minus className="terminal-button-icon" />
          </button>
          <button 
            className="terminal-button terminal-fullscreen" 
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            <Maximize className="terminal-button-icon" />
          </button>
          <button 
            className="terminal-button terminal-close" 
            aria-label="Close"
          >
            <X className="terminal-button-icon" />
          </button>
        </div>
      </div>
      
      {/* Scanlines overlay */}
      <div className="terminal-scanlines"></div>
      
      {/* Code content */}
      <div className="terminal-content">
        {generateDisplayCode()}
        {!isTyping && cursorVisible && (
          <span className="terminal-cursor">█</span>
        )}
      </div>
      
      {/* Terminal glitch effects */}
      <div className="terminal-glitch-effect"></div>
      
      <style jsx>{`
        /* Base terminal styles */
        .cyberpunk-terminal {
          position: relative;
          width: 100%;
          margin: 1rem 0;
          border-radius: 0.5rem;
          overflow: hidden;
          font-family: "JetBrains Mono", Menlo, Monaco, "Courier New", monospace;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(102, 252, 241, 0.3);
          font-size: 0.85rem;
        }
        
        .cyberpunk-terminal-fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          border-radius: 0;
        }
        
        /* Dark theme */
        .cyberpunk-terminal-dark {
          background-color: #0b0b16;
          color: #66FCF1;
        }
        
        /* Light theme */
        .cyberpunk-terminal-light {
          background-color: #f0f0f0;
          color: #333340;
          border-color: rgba(51, 51, 64, 0.3);
        }
        
        /* Terminal header */
        .terminal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.3rem 0.75rem;
          background-color: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(102, 252, 241, 0.3);
        }
        
        .cyberpunk-terminal-light .terminal-header {
          background-color: rgba(51, 51, 64, 0.1);
          border-bottom-color: rgba(51, 51, 64, 0.2);
        }
        
        .terminal-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .terminal-icon {
          width: 0.85rem;
          height: 0.85rem;
        }
        
        .terminal-controls {
          display: flex;
          gap: 0.3rem;
        }
        
        .terminal-button {
          background: none;
          border: none;
          cursor: pointer;
          width: 1.2rem;
          height: 1.2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .terminal-button-icon {
          width: 0.7rem;
          height: 0.7rem;
        }
        
        .terminal-close {
          background-color: rgba(255, 90, 90, 0.8);
        }
        
        .terminal-minimize {
          background-color: rgba(255, 190, 50, 0.8);
        }
        
        .terminal-fullscreen {
          background-color: rgba(50, 255, 120, 0.8);
        }
        
        .terminal-theme-button {
          background-color: rgba(80, 120, 255, 0.8);
        }
        
        .terminal-button:hover {
          filter: brightness(1.2);
        }
        
        .cyberpunk-terminal-dark .terminal-button-icon {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .cyberpunk-terminal-light .terminal-button-icon {
          color: rgba(0, 0, 0, 0.7);
        }
        
        /* Terminal content */
        .terminal-content {
          padding: 0.75rem;
          overflow-x: auto;
          position: relative;
          min-height: 2.5rem;
          max-height: 350px;
          overflow-y: auto;
        }
        
        .terminal-code {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.4;
          tab-size: 2;
        }
        
        /* Code table with line numbers */
        .terminal-code-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
          line-height: 1.4;
          tab-size: 2;
        }
        
        .terminal-line {
          white-space: pre;
        }
        
        .terminal-line-number {
          text-align: right;
          padding-right: 1rem;
          width: 2rem;
          user-select: none;
          opacity: 0.5;
          border-right: 1px solid rgba(102, 252, 241, 0.3);
        }
        
        .cyberpunk-terminal-light .terminal-line-number {
          border-right-color: rgba(51, 51, 64, 0.2);
        }
        
        .terminal-line-content {
          padding-left: 1rem;
        }
        
        /* Terminal cursor */
        .terminal-cursor {
          display: inline-block;
          width: 0.6rem;
          height: 1.2rem;
          background-color: #66FCF1;
          animation: blink 1s step-end infinite;
          vertical-align: text-bottom;
          margin-left: 2px;
        }
        
        .cyberpunk-terminal-light .terminal-cursor {
          background-color: #333340;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        /* Scanlines effect */
        .terminal-scanlines {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            rgba(102, 252, 241, 0) 50%,
            rgba(102, 252, 241, 0.02) 50%
          );
          background-size: 100% 4px;
          pointer-events: none;
          z-index: 10;
        }
        
        .cyberpunk-terminal-light .terminal-scanlines {
          background: linear-gradient(
            to bottom,
            rgba(51, 51, 64, 0) 50%,
            rgba(51, 51, 64, 0.02) 50%
          );
          background-size: 100% 4px;
        }
        
        /* Glitch effect */
        .terminal-glitch-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9;
          opacity: 0;
        }
        
        .cyberpunk-terminal:hover .terminal-glitch-effect {
          animation: glitch 2s infinite;
        }
        
        @keyframes glitch {
          0% { opacity: 0; }
          0.1% { opacity: 0.3; background-color: rgba(102, 252, 241, 0.1); transform: translate(-5px); }
          0.2% { opacity: 0; background-color: transparent; transform: translate(0); }
          1% { opacity: 0; }
          1.1% { opacity: 0.3; background-color: rgba(255, 0, 128, 0.1); transform: translate(5px); }
          1.2% { opacity: 0; background-color: transparent; transform: translate(0); }
          2% { opacity: 0; }
          2.1% { opacity: 0.3; background-color: rgba(102, 252, 241, 0.1); transform: translate(-2px); }
          2.2% { opacity: 0; background-color: transparent; transform: translate(0); }
          10% { opacity: 0; }
        }
        
        /* Syntax highlighting colors - Dark theme */
        .cyberpunk-terminal-dark .token.comment,
        .cyberpunk-terminal-dark .token.prolog,
        .cyberpunk-terminal-dark .token.doctype,
        .cyberpunk-terminal-dark .token.cdata {
          color: #6b7280;
        }
        
        .cyberpunk-terminal-dark .token.punctuation {
          color: #c084fc;
        }
        
        .cyberpunk-terminal-dark .token.property,
        .cyberpunk-terminal-dark .token.tag,
        .cyberpunk-terminal-dark .token.boolean,
        .cyberpunk-terminal-dark .token.number,
        .cyberpunk-terminal-dark .token.constant,
        .cyberpunk-terminal-dark .token.symbol,
        .cyberpunk-terminal-dark .token.deleted {
          color: #f472b6;
        }
        
        .cyberpunk-terminal-dark .token.selector,
        .cyberpunk-terminal-dark .token.attr-name,
        .cyberpunk-terminal-dark .token.string,
        .cyberpunk-terminal-dark .token.char,
        .cyberpunk-terminal-dark .token.builtin,
        .cyberpunk-terminal-dark .token.inserted {
          color: #34d399;
        }
        
        .cyberpunk-terminal-dark .token.operator,
        .cyberpunk-terminal-dark .token.entity,
        .cyberpunk-terminal-dark .token.url,
        .cyberpunk-terminal-dark .language-css .token.string,
        .cyberpunk-terminal-dark .style .token.string {
          color: #a78bfa;
        }
        
        .cyberpunk-terminal-dark .token.atrule,
        .cyberpunk-terminal-dark .token.attr-value,
        .cyberpunk-terminal-dark .token.keyword {
          color: #60a5fa;
        }
        
        .cyberpunk-terminal-dark .token.function,
        .cyberpunk-terminal-dark .token.class-name {
          color: #f59e0b;
        }
        
        .cyberpunk-terminal-dark .token.regex,
        .cyberpunk-terminal-dark .token.important,
        .cyberpunk-terminal-dark .token.variable {
          color: #ec4899;
        }
        
        /* Syntax highlighting colors - Light theme */
        .cyberpunk-terminal-light .token.comment,
        .cyberpunk-terminal-light .token.prolog,
        .cyberpunk-terminal-light .token.doctype,
        .cyberpunk-terminal-light .token.cdata {
          color: #6b7280;
        }
        
        .cyberpunk-terminal-light .token.punctuation {
          color: #6d28d9;
        }
        
        .cyberpunk-terminal-light .token.property,
        .cyberpunk-terminal-light .token.tag,
        .cyberpunk-terminal-light .token.boolean,
        .cyberpunk-terminal-light .token.number,
        .cyberpunk-terminal-light .token.constant,
        .cyberpunk-terminal-light .token.symbol,
        .cyberpunk-terminal-light .token.deleted {
          color: #be185d;
        }
        
        .cyberpunk-terminal-light .token.selector,
        .cyberpunk-terminal-light .token.attr-name,
        .cyberpunk-terminal-light .token.string,
        .cyberpunk-terminal-light .token.char,
        .cyberpunk-terminal-light .token.builtin,
        .cyberpunk-terminal-light .token.inserted {
          color: #047857;
        }
        
        .cyberpunk-terminal-light .token.operator,
        .cyberpunk-terminal-light .token.entity,
        .cyberpunk-terminal-light .token.url,
        .cyberpunk-terminal-light .language-css .token.string,
        .cyberpunk-terminal-light .style .token.string {
          color: #6d28d9;
        }
        
        .cyberpunk-terminal-light .token.atrule,
        .cyberpunk-terminal-light .token.attr-value,
        .cyberpunk-terminal-light .token.keyword {
          color: #1d4ed8;
        }
        
        .cyberpunk-terminal-light .token.function,
        .cyberpunk-terminal-light .token.class-name {
          color: #b45309;
        }
        
        .cyberpunk-terminal-light .token.regex,
        .cyberpunk-terminal-light .token.important,
        .cyberpunk-terminal-light .token.variable {
          color: #be185d;
        }
      `}</style>
    </div>
  );
}