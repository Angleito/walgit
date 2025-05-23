'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useStorage } from '@/hooks/use-storage';
import { 
  Folder, 
  Zap, 
  FileCode,
  Home,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
  GitBranch,
  Code,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description?: string;
}

export default function CyberpunkSidebar() {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Use storage hook instead of direct localStorage access
  const [isCollapsed, setIsCollapsed] = useStorage<boolean>('sidebarCollapsed', false);

  // Dispatch custom event when sidebar state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sidebarToggled'));
    }
  }, [isCollapsed]);

  const navItems: NavItem[] = [
    { 
      label: 'Home', 
      href: '/', 
      icon: Home,
      description: 'Dashboard'
    },
    { 
      label: 'Repositories', 
      href: '/repositories', 
      icon: Folder,
      description: 'Your repos'
    },
    { 
      label: 'Explore', 
      href: '/explore', 
      icon: Zap,
      description: 'Discover'
    },
    { 
      label: 'Demo', 
      href: '/demo', 
      icon: FileCode,
      description: 'Examples'
    },
  ];

  return (
    <>
      {/* Mobile menu button - visible only on mobile */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed left-4 top-[90px] z-50 md:hidden p-2 bg-[#161b22] border border-[#30363d] rounded-md hover:bg-[#1c2128] transition-colors"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop collapse/expand button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "hidden md:flex fixed z-50 p-2 bg-[#161b22] border border-[#30363d] rounded-md hover:bg-[#1c2128] transition-all duration-200",
          isCollapsed ? "left-[70px] top-[90px]" : "left-[235px] top-[90px]"
        )}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-[80px] h-[calc(100vh-80px)] bg-[#161b22] border-r border-[#30363d] transition-all duration-200 z-40",
          // Mobile
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop
          "md:translate-x-0",
          isCollapsed ? "md:w-[80px]" : "md:w-[250px]"
        )}
      >
        <nav className="h-full flex flex-col">
          {/* Main navigation */}
          <ul className="flex-1 py-6">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const isHovered = hoveredIndex === index;
              
              return (
                <li key={index} className="relative">
                  <Link
                    href={item.href}
                    prefetch={false}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-[#c9d1d9] bg-[#1f6feb]/10 border-l-2 border-[#1f6feb]"
                        : "text-[#7d8590] hover:text-[#c9d1d9] hover:bg-[#1c2128] border-l-2 border-transparent",
                      isCollapsed && "md:px-0 md:justify-center"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                      isHovered && "scale-110"
                    )} />
                    
                    {(!isCollapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
                      <span className="font-orbitron">{item.label}</span>
                    )}
                    
                    {/* Glitch effect on hover */}
                    {isHovered && (
                      <>
                        <div className="absolute inset-0 animate-glitch-1 mix-blend-screen opacity-50">
                          <div className="h-full w-full bg-gradient-to-r from-[#1f6feb] to-[#05D9E8]" />
                        </div>
                        <div className="absolute inset-0 animate-glitch-2 mix-blend-screen opacity-30">
                          <div className="h-full w-full bg-gradient-to-r from-[#05D9E8] to-[#FF6150]" />
                        </div>
                      </>
                    )}
                  </Link>

                  {/* Tooltip for collapsed sidebar */}
                  {isCollapsed && isHovered && typeof window !== 'undefined' && window.innerWidth >= 768 && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#1c2128] border border-[#30363d] rounded-md whitespace-nowrap z-50">
                      <span className="text-sm text-[#c9d1d9]">{item.label}</span>
                      <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[4px] border-r-[#30363d]" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Bottom section */}
          <div className="border-t border-[#30363d] py-4">
            <ul>
              <li>
                <Link
                  href="#"
                  prefetch={false}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 text-sm text-[#7d8590] hover:text-[#c9d1d9] hover:bg-[#1c2128] transition-all duration-200",
                    isCollapsed && "md:px-0 md:justify-center"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  {(!isCollapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
                    <span>Settings</span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  prefetch={false}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 text-sm text-[#7d8590] hover:text-[#c9d1d9] hover:bg-[#1c2128] transition-all duration-200",
                    isCollapsed && "md:px-0 md:justify-center"
                  )}
                >
                  <GitBranch className="w-4 h-4" />
                  {(!isCollapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
                    <span>Git Commands</span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  prefetch={false}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 text-sm text-[#7d8590] hover:text-[#c9d1d9] hover:bg-[#1c2128] transition-all duration-200",
                    isCollapsed && "md:px-0 md:justify-center"
                  )}
                >
                  <Code className="w-4 h-4" />
                  {(!isCollapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
                    <span>Documentation</span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
}