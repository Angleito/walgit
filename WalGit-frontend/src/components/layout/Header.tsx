import { Link } from "react-router-dom";
import { Search, Book, Star, GitFork, Menu, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const Header = ({ className }: { className?: string }) => {
  return (
    <header className={cn("w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4 flex">
          <Link to="/" className="mr-8 flex items-center space-x-2">
            <div className="relative h-7 w-7 overflow-hidden rounded-full">
              <img 
                src="/walgitv3.png"
                alt="WalGit Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden font-bold sm:inline-block">WalGit</span>
          </Link>
          <nav className="flex items-center space-x-4 lg:space-x-6">
            <Link to="/repositories" className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-ocean-600">
              <Book className="h-4 w-4" />
              <span>Repositories</span>
            </Link>
            <Link to="/explore" className="text-sm font-medium transition-colors hover:text-ocean-600">Explore</Link>
            <Link to="/network" className="text-sm font-medium transition-colors hover:text-ocean-600">Network</Link>
          </nav>
        </div>
        <div className="flex-1 flex items-center justify-end space-x-2">
          <div className="w-full max-w-[400px] relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search repositories..." 
              className="w-full rounded-full pl-8 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ocean-400" 
            />
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Plus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
