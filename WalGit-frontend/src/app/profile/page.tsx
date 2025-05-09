import { Metadata } from 'next';
import { Book, GitFork, Star, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Profile - WalGit',
  description: 'Your WalGit profile page',
};

export default function ProfilePage() {
  // Mock user data
  const user = {
    username: 'johndoe',
    fullName: 'John Doe',
    avatarUrl: null,
    bio: 'Blockchain developer and open source contributor',
    followers: 56,
    following: 42,
    repos: 15,
    wallet: '0x1234...5678',
    joinedDate: '2024-01-15T00:00:00Z',
    activities: [
      { id: 1, type: 'commit', repo: 'walgit-core', message: 'Fix authentication bug', timestamp: '2025-04-03T14:30:00Z' },
      { id: 2, type: 'fork', repo: 'smart-contracts', source: 'walgit/smart-contracts', timestamp: '2025-04-01T10:15:00Z' },
      { id: 3, type: 'star', repo: 'documentation', timestamp: '2025-03-28T08:45:00Z' },
      { id: 4, type: 'create_repo', repo: 'personal-project', timestamp: '2025-03-15T16:20:00Z' },
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex flex-col items-center mb-6">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.username} 
                  className="w-32 h-32 rounded-full mb-4 border-4 border-gray-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold mb-4">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
              )}
              <h1 className="text-2xl font-bold">{user.fullName}</h1>
              <p className="text-gray-600">@{user.username}</p>
            </div>
            
            {user.bio && (
              <div className="mb-6">
                <p className="text-gray-700">{user.bio}</p>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 text-center mb-6">
              <div className="flex flex-col items-center py-2 px-1 rounded bg-gray-50">
                <Book className="h-4 w-4 mb-1 text-blue-600" />
                <span className="text-xs text-gray-500">Repos</span>
                <span className="font-semibold">{user.repos}</span>
              </div>
              <div className="flex flex-col items-center py-2 px-1 rounded bg-gray-50">
                <User className="h-4 w-4 mb-1 text-blue-600" />
                <span className="text-xs text-gray-500">Followers</span>
                <span className="font-semibold">{user.followers}</span>
              </div>
              <div className="flex flex-col items-center py-2 px-1 rounded bg-gray-50">
                <GitFork className="h-4 w-4 mb-1 text-blue-600" />
                <span className="text-xs text-gray-500">Following</span>
                <span className="font-semibold">{user.following}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Wallet</h2>
              <p className="text-gray-700 font-mono text-sm break-all">{user.wallet}</p>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2">Joined</h2>
              <p className="text-gray-700">
                {new Date(user.joinedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold">Activity</h2>
            </div>
            
            <div className="divide-y">
              {user.activities.map(activity => (
                <div key={activity.id} className="px-6 py-4">
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      {activity.type === 'commit' && (
                        <div className="bg-green-100 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="4"></circle>
                            <line x1="1.05" y1="12" x2="7" y2="12"></line>
                            <line x1="17.01" y1="12" x2="22.96" y2="12"></line>
                          </svg>
                        </div>
                      )}
                      {activity.type === 'fork' && (
                        <div className="bg-blue-100 p-2 rounded-full">
                          <GitFork className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      {activity.type === 'star' && (
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <Star className="h-5 w-5 text-yellow-600" />
                        </div>
                      )}
                      {activity.type === 'create_repo' && (
                        <div className="bg-purple-100 p-2 rounded-full">
                          <Book className="h-5 w-5 text-purple-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="mb-1">
                        <span className="font-medium">{user.username}</span>
                        {activity.type === 'commit' && (
                          <span className="text-gray-600"> committed to <a href={`/repositories/johndoe/${activity.repo}`} className="text-blue-600 hover:underline">{activity.repo}</a>: {activity.message}</span>
                        )}
                        {activity.type === 'fork' && (
                          <span className="text-gray-600"> forked <a href={`/repositories/${activity.source}`} className="text-blue-600 hover:underline">{activity.source}</a> to <a href={`/repositories/johndoe/${activity.repo}`} className="text-blue-600 hover:underline">{activity.repo}</a></span>
                        )}
                        {activity.type === 'star' && (
                          <span className="text-gray-600"> starred <a href={`/repositories/walgit/${activity.repo}`} className="text-blue-600 hover:underline">{activity.repo}</a></span>
                        )}
                        {activity.type === 'create_repo' && (
                          <span className="text-gray-600"> created repository <a href={`/repositories/johndoe/${activity.repo}`} className="text-blue-600 hover:underline">{activity.repo}</a></span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}