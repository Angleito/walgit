import { Link } from "react-router-dom";
import { Star, GitFork, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Shimmer } from "@/components/ui/shimmer";

interface RepoCardProps {
  name: string;
  description: string;
  language?: string;
  stars: number;
  forks: number;
  className?: string;
  languageColor?: string;
  lastUpdated?: string;
  owner: string;
}

export const RepoCard = ({
  name,
  description,
  language,
  stars,
  forks,
  className,
  languageColor = "bg-blue-400",
  lastUpdated,
  owner,
}: RepoCardProps) => {
  return (
    <Shimmer>
      <div 
        className={cn(
          "relative group p-4 rounded-lg border border-border/60 bg-card/30 hover:bg-card/80 hover:border-blue-200/60 transition-all overflow-hidden",
          className
        )}
      >
        {/* Hover effect gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100/10 to-violet-100/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-200/0 via-blue-200/10 to-blue-200/0 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-1000 group-hover:duration-500 animate-pulse"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Link 
                to={`/${owner}/${name}`}
                className="text-lg font-medium hover:text-blue-400 transition-colors truncate"
              >
                {name}
              </Link>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{stars}</span>
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="h-4 w-4" />
                <span>{forks}</span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-300 mb-4 line-clamp-2">
            {description}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {language && (
              <div className="flex items-center gap-1.5">
                <Circle className={cn("h-3 w-3 fill-current", languageColor)} />
                <span>{language}</span>
              </div>
            )}
            {lastUpdated && (
              <span>Updated {lastUpdated}</span>
            )}
          </div>
        </div>
      </div>
    </Shimmer>
  );
};
