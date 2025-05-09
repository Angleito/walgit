import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Repositories - WalGit',
  description: 'Browse your repositories on WalGit',
};

// Sample repository data
const repositories = [
  {
    id: '1',
    name: 'walgit-core',
    description: 'Core implementation of the WalGit decentralized version control system',
    owner: 'walgit',
    stars: 42,
    forks: 12,
    updatedAt: '2025-04-01T12:00:00Z',
    language: 'TypeScript'
  },
  {
    id: '2',
    name: 'smart-contracts',
    description: 'Smart contracts for the WalGit platform implemented on Sui Move',
    owner: 'walgit',
    stars: 28,
    forks: 8,
    updatedAt: '2025-03-28T15:30:00Z',
    language: 'Move'
  },
  {
    id: '3',
    name: 'documentation',
    description: 'Official documentation for WalGit',
    owner: 'walgit',
    stars: 15,
    forks: 5,
    updatedAt: '2025-03-15T09:45:00Z',
    language: 'Markdown'
  }
];

export default function RepositoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Repositories</h1>
        <Link 
          href="/new-repository" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          New Repository
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {repositories.map(repo => (
          <div key={repo.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">
                  <Link href={`/repositories/${repo.owner}/${repo.name}`} className="text-blue-600 hover:underline">
                    {repo.owner}/{repo.name}
                  </Link>
                </h2>
                <p className="text-gray-600 mt-1">{repo.description}</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  {repo.stars}
                </span>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 18l6-6-6-6"></path>
                    <path d="M17 6v12"></path>
                  </svg>
                  {repo.forks}
                </span>
                {repo.language && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {repo.language}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-4">
              Updated {new Date(repo.updatedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}