import { Metadata } from 'next';
import Link from 'next/link';

interface RepositoryPageProps {
  params: {
    owner: string;
    repo: string;
  };
}

export function generateMetadata({ params }: RepositoryPageProps): Metadata {
  return {
    title: `${params.owner}/${params.repo} - WalGit`,
    description: `Repository ${params.owner}/${params.repo} on WalGit`,
  };
}

export default function RepositoryPage({ params }: RepositoryPageProps) {
  const { owner, repo } = params;

  // This would normally be fetched from an API
  const repository = {
    name: repo,
    owner: owner,
    description: 'Sample repository description. This would normally be fetched from an API.',
    stars: 42,
    forks: 12,
    watchers: 8,
    defaultBranch: 'main',
    lastCommit: {
      hash: 'abc1234',
      message: 'Update README.md',
      author: 'johndoe',
      date: '2025-04-02T14:30:00Z'
    },
    files: [
      { name: 'README.md', type: 'file', lastCommit: 'Update README.md', updatedAt: '2025-04-02T14:30:00Z' },
      { name: 'src', type: 'directory', lastCommit: 'Refactor code', updatedAt: '2025-03-28T10:15:00Z' },
      { name: 'package.json', type: 'file', lastCommit: 'Update dependencies', updatedAt: '2025-03-25T09:45:00Z' },
      { name: 'LICENSE', type: 'file', lastCommit: 'Initial commit', updatedAt: '2025-03-20T08:30:00Z' },
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/repositories" className="hover:text-blue-600">Repositories</Link>
          <span className="mx-2">/</span>
          <Link href={`/repositories/${owner}`} className="hover:text-blue-600">{owner}</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-700">{repo}</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">{repo}</h1>
        <p className="text-gray-600">{repository.description}</p>
        
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center text-sm">
            <span className="flex items-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span className="font-medium">{repository.stars}</span>
              <span className="ml-1 text-gray-500">stars</span>
            </span>
            <span className="flex items-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 18l6-6-6-6"></path>
                <path d="M17 6v12"></path>
              </svg>
              <span className="font-medium">{repository.forks}</span>
              <span className="ml-1 text-gray-500">forks</span>
            </span>
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span className="font-medium">{repository.watchers}</span>
              <span className="ml-1 text-gray-500">watching</span>
            </span>
          </div>
        </div>
      </div>
      
      <div className="mb-6 flex items-center justify-between">
        <div className="relative inline-block text-left">
          <div className="flex items-center">
            <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3v12"></path>
                <circle cx="18" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <path d="M18 9a9 9 0 0 1-9 9"></path>
              </svg>
              {repository.defaultBranch}
            </button>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            Clone
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Code
          </button>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <span className="font-medium">
              Last commit:
            </span>
            <span className="ml-2 text-gray-500">
              <span className="font-mono">{repository.lastCommit.hash.substring(0, 7)}</span> - {repository.lastCommit.message}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            by {repository.lastCommit.author} on {new Date(repository.lastCommit.date).toLocaleDateString()}
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {repository.files.map((file, index) => (
            <div key={index} className="flex items-center px-4 py-3 hover:bg-gray-50">
              <div className="mr-2">
                {file.type === 'directory' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <Link 
                  href={`/repositories/${owner}/${repo}/${file.type === 'directory' ? 'tree' : 'blob'}/main/${file.name}`}
                  className="font-medium hover:text-blue-600"
                >
                  {file.name}
                </Link>
              </div>
              <div className="text-sm text-gray-500">
                {file.lastCommit}
              </div>
              <div className="ml-4 text-sm text-gray-500">
                {new Date(file.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}