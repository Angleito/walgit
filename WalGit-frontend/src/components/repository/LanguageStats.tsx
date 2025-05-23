'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Language {
  name: string;
  percentage: number;
  color: string;
  size: number;
}

interface LanguageStatsProps {
  languages: Language[];
  className?: string;
}

export function LanguageStats({ languages, className }: LanguageStatsProps) {
  const totalSize = languages.reduce((acc, lang) => acc + lang.size, 0);
  
  // Sort languages by percentage
  const sortedLanguages = [...languages].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Language bar */}
      <div className="relative h-2 rounded-full bg-[#161b22] overflow-hidden">
        <div className="flex h-full">
          {sortedLanguages.map((lang, index) => (
            <div
              key={lang.name}
              className="h-full transition-all duration-300 hover:opacity-80"
              style={{
                width: `${lang.percentage}%`,
                backgroundColor: lang.color,
                marginLeft: index > 0 ? '1px' : 0,
              }}
              title={`${lang.name}: ${lang.percentage}%`}
            />
          ))}
        </div>
      </div>

      {/* Language list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sortedLanguages.map((lang) => (
          <div key={lang.name} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: lang.color }}
            />
            <span className="text-[#f0f6fc] font-medium">{lang.name}</span>
            <span className="text-[#8b949e]">{lang.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Common language colors (GitHub-style)
export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#2b7489',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Kotlin: '#F18E33',
  Scala: '#c22d40',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#4fc08d',
  React: '#61dafb',
  Angular: '#dd0031',
  Markdown: '#083fa1',
  JSON: '#292929',
  XML: '#0060ac',
  YAML: '#cb171e',
  SQL: '#e38c00',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  CMake: '#DA3434',
  Gradle: '#02303a',
  Maven: '#C71E3B',
  R: '#198CE7',
  MATLAB: '#e16737',
  Perl: '#0298c3',
  Objective_C: '#438eff',
  Dart: '#00B4AB',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Haskell: '#5e5086',
  Lua: '#000080',
  Pascal: '#E3F171',
  Fortran: '#4d41b1',
  Assembly: '#6E4C13',
  VHDL: '#adb2cb',
  Verilog: '#b2b7f8',
  COBOL: '#ed2c2c',
  Ada: '#02f88c',
  PureScript: '#1D222D',
  Elm: '#60B5CC',
  OCaml: '#3be133',
  F_Sharp: '#b845fc',
  Crystal: '#000100',
  Nim: '#37775b',
  Solidity: '#AA6746',
  Move: '#4a90e2',
};

// Helper function to get language color
export function getLanguageColor(language: string): string {
  // Normalize language name (handle variations)
  const normalized = language.replace(/[#\+\s]/g, '_');
  return LANGUAGE_COLORS[normalized] || '#' + Math.floor(Math.random()*16777215).toString(16);
}

// Calculate language statistics from file tree
export function calculateLanguageStats(files: Array<{ name: string; size: number }>): Language[] {
  const languageData: Record<string, number> = {};
  
  files.forEach(file => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension) return;
    
    // Map extensions to languages
    const langMap: Record<string, string> = {
      js: 'JavaScript',
      jsx: 'JavaScript',
      ts: 'TypeScript',
      tsx: 'TypeScript',
      py: 'Python',
      java: 'Java',
      cpp: 'C++',
      cc: 'C++',
      cxx: 'C++',
      c: 'C',
      h: 'C',
      hpp: 'C++',
      go: 'Go',
      rs: 'Rust',
      rb: 'Ruby',
      php: 'PHP',
      swift: 'Swift',
      kt: 'Kotlin',
      scala: 'Scala',
      sh: 'Shell',
      bash: 'Shell',
      html: 'HTML',
      htm: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      sass: 'SCSS',
      vue: 'Vue',
      md: 'Markdown',
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      yml: 'YAML',
      sql: 'SQL',
      dockerfile: 'Dockerfile',
      makefile: 'Makefile',
      cmake: 'CMake',
      gradle: 'Gradle',
      r: 'R',
      m: 'MATLAB',
      pl: 'Perl',
      dart: 'Dart',
      ex: 'Elixir',
      exs: 'Elixir',
      clj: 'Clojure',
      hs: 'Haskell',
      lua: 'Lua',
      pas: 'Pascal',
      f90: 'Fortran',
      f: 'Fortran',
      asm: 'Assembly',
      s: 'Assembly',
      vhd: 'VHDL',
      v: 'Verilog',
      cob: 'COBOL',
      ada: 'Ada',
      purs: 'PureScript',
      elm: 'Elm',
      ml: 'OCaml',
      mli: 'OCaml',
      fs: 'F#',
      fsi: 'F#',
      fsx: 'F#',
      cr: 'Crystal',
      nim: 'Nim',
      sol: 'Solidity',
      move: 'Move',
    };
    
    const language = langMap[extension];
    if (language) {
      languageData[language] = (languageData[language] || 0) + file.size;
    }
  });
  
  const totalSize = Object.values(languageData).reduce((acc, size) => acc + size, 0);
  
  const languages = Object.entries(languageData).map(([name, size]) => ({
    name,
    size,
    percentage: (size / totalSize) * 100,
    color: getLanguageColor(name),
  }));
  
  return languages.sort((a, b) => b.percentage - a.percentage);
}