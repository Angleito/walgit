/**
 * Cyberpunk theme templates for quick application to sections
 */

export interface ThemeTemplate {
  containerClass: string;
  headingClass: string;
  textClass: string;
  buttonVariant: string;
  backgroundComponent?: string;
  effectComponent?: string;
}

export const cyberpunkThemeTemplates = {
  // Blue-centric theme for repository sections
  repoSection: {
    containerClass: "bg-cyber-darker border-l-4 border-neon-blue rounded-tr-md p-6 relative overflow-hidden",
    headingClass: "text-neon-blue font-mono text-2xl font-bold tracking-wider mb-4",
    textClass: "text-blue-50 leading-relaxed",
    buttonVariant: "neon-blue",
    backgroundComponent: "CircuitBackground",
    effectComponent: "ScanlineOverlay"
  },
  
  // Purple-centric theme for profile sections
  profileSection: {
    containerClass: "bg-cyber-darker border-l-4 border-neon-purple rounded-tr-md p-6 relative overflow-hidden",
    headingClass: "text-neon-purple font-mono text-2xl font-bold tracking-wider mb-4",
    textClass: "text-purple-50 leading-relaxed",
    buttonVariant: "neon-purple",
    backgroundComponent: "HexagonalGrid"
  },
  
  // Green-centric theme for code sections
  codeSection: {
    containerClass: "bg-cyber-darker border-l-4 border-matrix-green rounded-tr-md p-6 relative overflow-hidden",
    headingClass: "text-matrix-green font-mono text-2xl font-bold tracking-wider mb-4",
    textClass: "text-green-50 leading-relaxed font-mono",
    buttonVariant: "neon-green",
    effectComponent: "CodeOverlay"
  },
  
  // Pink-centric theme for action sections
  actionSection: {
    containerClass: "bg-cyber-darker border-l-4 border-neon-pink rounded-tr-md p-6 relative overflow-hidden",
    headingClass: "text-neon-pink font-mono text-2xl font-bold tracking-wider mb-4",
    textClass: "text-pink-50 leading-relaxed",
    buttonVariant: "neon-pink",
    backgroundComponent: "DataFlowBackground"
  },
  
  // Terminal theme for command sections
  terminalSection: {
    containerClass: "bg-black border border-gray-700 rounded-md p-4 font-mono relative",
    headingClass: "text-matrix-green text-lg font-bold mb-2 flex items-center gap-2 before:content-['$'] before:text-neon-green",
    textClass: "text-green-400 text-sm",
    buttonVariant: "minimal",
    effectComponent: "TerminalCursor"
  },
  
  // Dashboard theme for stats sections
  dashboardSection: {
    containerClass: "bg-cyber-dark grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-md border border-blue-900",
    headingClass: "text-neon-blue col-span-full font-mono text-xl font-bold mb-2",
    textClass: "text-blue-100",
    buttonVariant: "neon-blue-small",
    backgroundComponent: "GridBackground"
  }
};

// Usage example:
/*
import { cyberpunkThemeTemplates } from '@/components/ui/theme-templates';

const { containerClass, headingClass, textClass, buttonVariant } = cyberpunkThemeTemplates.repoSection;

return (
  <div className={containerClass}>
    <h2 className={headingClass}>Repository Storage</h2>
    <p className={textClass}>Decentralized storage for your Git repositories</p>
    <CyberpunkButton variant={buttonVariant}>View Details</CyberpunkButton>
  </div>
)
*/