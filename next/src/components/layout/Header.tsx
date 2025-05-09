import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Header({ className }: { className?: string }) {
  return (
    <header className={cn("w-full border-b border-gray-200 bg-white shadow-sm", className)}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link 
            href="/" 
            className="text-xl font-bold text-blue-600 flex items-center"
          >
            WalGit
          </Link>
          
          <nav className="ml-10 hidden md:flex space-x-8">
            <Link 
              href="/repositories" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Repositories
            </Link>
            <Link 
              href="/explore" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Explore
            </Link>
            <Link 
              href="/docs" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Documentation
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    </header>
  );
}