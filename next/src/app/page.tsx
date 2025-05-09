import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center text-center space-y-8 py-12">
        <h1 className="text-5xl font-bold tracking-tighter">
          Decentralized Version Control on the Blockchain
        </h1>
        <p className="text-xl text-gray-600 max-w-[700px]">
          WalGit is a decentralized version control system built on the Sui blockchain,
          enabling secure and transparent code collaboration.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/repositories">
            <Button>
              Browse Repositories
            </Button>
          </Link>
          <Link href="/new-repository">
            <Button variant="outline">
              Create Repository
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        <div className="flex flex-col items-center text-center p-6 border rounded-lg">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="14.31" y1="8" x2="20.05" y2="17.94"></line>
              <line x1="9.69" y1="8" x2="21.17" y2="8"></line>
              <line x1="7.38" y1="12" x2="13.12" y2="2.06"></line>
              <line x1="9.69" y1="16" x2="3.95" y2="6.06"></line>
              <line x1="14.31" y1="16" x2="2.83" y2="16"></line>
              <line x1="16.62" y1="12" x2="10.88" y2="21.94"></line>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Decentralized Storage</h3>
          <p className="text-gray-600">
            Your code is securely stored on the blockchain, ensuring transparency and immutability.
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center p-6 border rounded-lg">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Smart Contract Integration</h3>
          <p className="text-gray-600">
            Leverage the power of smart contracts for version control operations and permissions.
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center p-6 border rounded-lg">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3v5h5"></path>
              <path d="M21 8l-5-5-5 5"></path>
              <path d="M14 12L8 6l-6 6"></path>
              <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V17"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Seamless Collaboration</h3>
          <p className="text-gray-600">
            Collaborate with developers worldwide with built-in authentication and permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
