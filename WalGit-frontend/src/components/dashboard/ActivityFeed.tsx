import { Book, Code, GitFork, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ActivityType = 'star' | 'fork' | 'commit' | 'repo' | 'pull';

interface ActivityItemProps {
  type: ActivityType;
  username: string;
  avatarUrl?: string;
  repoName: string;
  time: string;
  description?: string;
}

const ActivityItem = ({ type, username, avatarUrl, repoName, time, description }: ActivityItemProps) => {
  const getIcon = () => {
    switch (type) {
      case 'star':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'fork':
        return <GitFork className="h-4 w-4 text-blue-600" />;
      case 'commit':
        return <Code className="h-4 w-4 text-violet-600" />;
      case 'repo':
        return <Book className="h-4 w-4 text-blue-500" />;
      case 'pull':
        return <GitFork className="h-4 w-4 rotate-180 text-violet-500" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'star':
        return 'starred';
      case 'fork':
        return 'forked';
      case 'commit':
        return 'committed to';
      case 'repo':
        return 'created repository';
      case 'pull':
        return 'opened pull request in';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'star':
        return 'bg-[#112240]';
      case 'fork':
        return 'bg-[#112240]';
      case 'commit':
        return 'bg-[#112240]';
      case 'repo':
        return 'bg-[#112240]';
      case 'pull':
        return 'bg-[#112240]';
    }
  };

  return (
    <div className={cn("relative p-3 rounded-md mb-3 transition-all border border-white/5 hover:border-white/10", getBgColor())}>
      {/* Animated flowing water effect */}
      <div className="absolute inset-0 overflow-hidden rounded-md">
        <div 
          className="h-full w-[300%] bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1500"
          style={{ transform: 'translateX(-100%)' }}
        ></div>
      </div>
      
      <div className="relative z-10 flex items-center">
        <Avatar className="h-8 w-8 mr-3 ring-1 ring-white/10">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback className="bg-[#1E293B] text-white">
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-medium text-sm text-white">{username}</span>
            <span className="text-sm text-gray-400">{getTitle()}</span>
            <span className="font-medium text-sm text-blue-400">{repoName}</span>
          </div>
          
          {description && (
            <p className="text-xs text-gray-400 mb-1">{description}</p>
          )}
          
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs text-gray-400">
              {getIcon()}
            </div>
            <span className="text-xs text-gray-400">{time}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityFeed = () => {
  const activities: ActivityItemProps[] = [
    {
      type: 'star',
      username: 'web3dev',
      repoName: 'smart-contracts',
      time: '2 hours ago',
      description: 'Advanced smart contracts for Git operations'
    },
    {
      type: 'commit',
      username: 'gitmaster',
      repoName: 'core',
      time: '4 hours ago',
      description: 'Fix memory leak in blockchain sync'
    },
    {
      type: 'fork',
      username: 'chaindev',
      repoName: 'decentralized-git',
      time: '6 hours ago'
    },
    {
      type: 'pull',
      username: 'blocksmith',
      repoName: 'web3-git-sync',
      time: '1 day ago',
      description: 'Add new transaction types for atomic commits'
    },
    {
      type: 'repo',
      username: 'devsecops',
      repoName: 'git-protocol',
      time: '2 days ago',
      description: 'New decentralized Git implementation with Web3 auth'
    }
  ];

  return (
    <div className="w-full p-4 rounded-lg border border-white/10 bg-[#0A192F]/80 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-4 text-white">Activity Feed</h3>
      <div className="space-y-2">
        {activities.map((activity, index) => (
          <ActivityItem key={index} {...activity} />
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
