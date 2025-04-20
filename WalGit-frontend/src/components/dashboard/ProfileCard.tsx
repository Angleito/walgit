
import { Book, GitFork, Star, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ProfileCardProps {
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  followers: number;
  following: number;
  repos: number;
}

export const ProfileCard = ({
  username,
  fullName,
  bio,
  avatarUrl,
  followers,
  following,
  repos,
}: ProfileCardProps) => {
  return (
    <div className="w-full p-5 rounded-lg border border-white/10 bg-[#0A192F]/80 backdrop-blur-sm">
      <div className="relative">
        {/* Subtle animated wave background */}
        <div className="absolute -top-5 -left-5 -right-5 h-32 overflow-hidden opacity-5">
          <div className="w-[200%] h-20 bg-blue-400 rounded-[100%] animate-[wave_8s_ease-in-out_infinite]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center mb-4">
          <Avatar className="h-24 w-24 mb-3 ring-2 ring-white/10 shadow-lg">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-xl font-bold text-white">{fullName || username}</h2>
          <span className="text-gray-400">@{username}</span>
          
          {bio && <p className="mt-2 text-center text-sm text-gray-400">{bio}</p>}
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div className="flex flex-col items-center py-2 px-1 rounded bg-[#112240] border border-white/5">
            <Book className="h-4 w-4 mb-1 text-blue-400" />
            <span className="text-xs text-gray-400">Repositories</span>
            <span className="font-semibold text-white">{repos}</span>
          </div>
          <div className="flex flex-col items-center py-2 px-1 rounded bg-[#112240] border border-white/5">
            <User className="h-4 w-4 mb-1 text-blue-400" />
            <span className="text-xs text-gray-400">Followers</span>
            <span className="font-semibold text-white">{followers}</span>
          </div>
          <div className="flex flex-col items-center py-2 px-1 rounded bg-[#112240] border border-white/5">
            <GitFork className="h-4 w-4 mb-1 text-blue-400" />
            <span className="text-xs text-gray-400">Following</span>
            <span className="font-semibold text-white">{following}</span>
          </div>
        </div>
        
        <Button variant="ocean" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Follow</Button>
      </div>
    </div>
  );
};
