
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
  languageColor = "bg-ocean-400",
  lastUpdated,
  owner,
}: RepoCardProps) => {
  return (
    <Shimmer>
      <div 
        className={cn(
          "relative group p-4 rounded-lg border border-border/60 bg-card/30 hover:bg-card/80 hover:border-ocean-200/60 transition-all overflow-hidden",
          className
        )}
      >
      {/* Ocean wave effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-ocean-100/10 to-sui-100/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute -inset-1 bg-gradient-to-r from-ocean-200/0 via-ocean-200/10 to-ocean-200/0 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-1000 group-hover:duration-500 animate-pulse"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <Link 
            to={`/${owner}/${name}`} 
            className="text-lg font-medium text-ocean-700 hover:text-ocean-800 hover:underline"
          >
            {name}
          </Link>
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Star className="mr-1 h-4 w-4" />
              <span>{stars}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <GitFork className="mr-1 h-4 w-4" />
              <span>{forks}</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center text-xs text-muted-foreground space-x-4">
          {language && (
            <div className="flex items-center">
              <Circle className={`mr-1 h-3 w-3 ${languageColor} fill-current`} />
              <span>{language}</span>
            </div>
          )}
          {lastUpdated && <div>Updated {lastUpdated}</div>}
        </div>
      </div>
    </div>
    </Shimmer>
  );
};
