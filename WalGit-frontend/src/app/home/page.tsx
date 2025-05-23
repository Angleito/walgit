'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import CyberpunkCard from '@/components/ui/cyberpunk-card';
import { CyberpunkTerminal } from '@/components/ui/cyberpunk-terminal';
import { Copy } from 'lucide-react';

export default function WalGitHomePage() {
  const [copied, setCopied] = useState<{[key: string]: boolean}>({});
  
  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied({ ...copied, [id]: true });
    setTimeout(() => setCopied({ ...copied, [id]: false }), 2000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-black">
      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto relative overflow-hidden rounded-lg p-8 md:p-12 mb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/30 z-0 animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-cyber-grid bg-[length:20px_20px] opacity-30 z-0 animate-pulse-subtle"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white font-mono tracking-tight">
            <span className="text-[#05d9e8] glow glow-blue-500-md animated-bounce-sm">WalGit</span> <span className="animated-fade-in-up animated-duration-1000">Decentralized Version Control</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl animated-fade-in animated-delay-300 animated-duration-1000">
            Built on Sui and Walrus for Storage
          </p>
          <div className="flex flex-wrap gap-4 animated-fade-in-up animated-delay-500 animated-duration-1000">
            <Button variant="outline" className="border-[#05d9e8] text-[#05d9e8] hover:bg-[#05d9e8]/10 glow-on-hover glow-[#05d9e8]-sm">
              Get Started
            </Button>
            <Button variant="outline" className="border-[#ff2a6d] text-[#ff2a6d] hover:bg-[#ff2a6d]/10 glow-on-hover glow-[#ff2a6d]-sm">
              Connect Wallet
            </Button>
          </div>
        </div>
      </section>

      {/* Repository Cards */}
      <section className="w-full max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-[#bf5af2] mb-8 font-mono text-center glow glow-purple-400-sm animated-fade-in-down animated-duration-1000">Repository Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CyberpunkCard
            variant="purple"
            glowIntensity="lg"
            motionEffect={true}
            className="animated-fade-in-left"
            onClick={() => console.log('Card clicked')}
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-800 rounded-full flex items-center justify-center mr-3">
                <span className="text-lg font-bold text-white">W</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-purple-400">walgit-core</h3>
                <p className="text-sm text-gray-400">Updated 2 hours ago</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4">Core repository with smart contract implementations and blockchain integration</p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center text-blue-400">
                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                Move
              </div>
              <div className="text-gray-400">15 stars</div>
              <div className="text-gray-400">8 forks</div>
            </div>
          </CyberpunkCard>

          <CyberpunkCard
            variant="yellow"
            glowIntensity="md"
            scanlineEffect={true}
            className="animated-fade-in-right"
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-yellow-800 rounded-full flex items-center justify-center mr-3">
                <span className="text-lg font-bold text-white">D</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-yellow-400">dapp-examples</h3>
                <p className="text-sm text-gray-400">Updated 5 days ago</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4">Example dApps showcasing WalGit integration with various blockchain frameworks</p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center text-green-400">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                TypeScript
              </div>
              <div className="text-gray-400">7 stars</div>
              <div className="text-gray-400">3 forks</div>
            </div>
          </CyberpunkCard>
        </div>
      </section>

      {/* Blockchain Visualization */}
      <section className="w-full max-w-6xl mx-auto mb-16 animated-fade-in animated-duration-1000 animated-delay-700">
        <h2 className="text-3xl font-bold text-[#ff2a6d] mb-8 font-mono text-center glow glow-red-400-sm">Blockchain Integration</h2>
        <div className="bg-black/50 p-6 rounded-lg shadow-lg relative h-[300px] border border-[#ff2a6d]/30 glow glow-red-500-lg">
          <div className="absolute inset-0 bg-cyber-grid-large bg-[length:30px_30px] opacity-20 z-0 animate-pulse-subtle"></div>
          <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center overflow-hidden">
            <div className="relative">
              {/* Animated hexagons */}
              <div className="absolute -left-32 -top-32 w-64 h-64 border border-[#05d9e8]/30 rotate-45 animate-spin-slow opacity-20"></div>
              <div className="absolute -right-32 -bottom-32 w-64 h-64 border border-[#ff2a6d]/30 rotate-45 animate-spin-slow opacity-20"></div>

              <div className="text-white text-xl glow glow-blue-400-md animated-pulse animated-duration-2000 animated-infinite">Walrus Storage Visualization</div>
            </div>

            {/* Animated data particles */}
            <div className="absolute top-1/4 left-1/4 h-2 w-2 bg-[#05d9e8] rounded-full animate-data-particle-1"></div>
            <div className="absolute top-3/4 left-1/2 h-2 w-2 bg-[#ff2a6d] rounded-full animate-data-particle-2"></div>
            <div className="absolute top-1/2 left-3/4 h-2 w-2 bg-[#00ff9f] rounded-full animate-data-particle-3"></div>
          </div>

          <div className="absolute top-4 right-4 bg-black/80 p-3 rounded text-sm text-[#00ff9f] font-mono border border-[#00ff9f]/30 backdrop-blur-sm animated-fade-in-left">
            <div>Network Status: <span className="text-green-400 glow glow-green-400-sm">Active</span></div>
            <div>Storage Nodes: <span className="text-blue-400 glow glow-blue-400-sm">12</span></div>
            <div>Total Stored: <span className="text-purple-400 glow glow-purple-400-sm">1.45 TB</span></div>
          </div>

          {/* Scanner effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#05d9e8]/70 to-transparent animate-scanner"></div>
          </div>
        </div>
      </section>


      {/* Terminal Section */}
      <section className="w-full max-w-4xl mx-auto mb-12 animated-fade-in animated-duration-1000 animated-delay-1000">
        <h2 className="text-3xl font-bold text-[#00ff9f] mb-6 font-mono text-center glow glow-green-500-sm animated-fade-in-down animated-duration-1000">CLI Commands</h2>
        <div className="relative rounded-md overflow-hidden">
          <div className="absolute inset-0 bg-scanline-pattern opacity-10 pointer-events-none z-10"></div>
          <div className="flex items-center mb-2">
            <span className="text-xs py-1 px-2 rounded-md bg-[#00ff9f]/20 text-[#00ff9f] border border-[#00ff9f]/30">
              Bash
            </span>
            <button 
              className="ml-auto text-xs py-1 px-2 rounded-md bg-black/30 text-gray-300 hover:bg-black/50 transition-colors duration-200 flex items-center gap-1"
              onClick={() => copyToClipboard(`# Initialize a new WalGit repository
walgit init my-project

# Connect your wallet
walgit wallet connect

# Add and commit files
walgit add .
walgit commit -m "Initial commit"

# Push to the blockchain
walgit push origin main`, 'terminal')}
            >
              {copied['terminal'] ? 'Copied!' : 'Copy'}
              <Copy size={12} />
            </button>
          </div>
          <CyberpunkTerminal 
            code={`# Initialize a new WalGit repository
walgit init my-project

# Connect your wallet
walgit wallet connect

# Add and commit files
walgit add .
walgit commit -m "Initial commit"

# Push to the blockchain
walgit push origin main`}
            language="bash"
            title="terminal@walgit:~$"
            showLineNumbers={true}
            animateTyping={true}
            className="glow glow-green-500-md"
          />
        </div>
      </section>

      {/* Repository Section Example */}
      <section className="w-full max-w-5xl mx-auto mb-12 animated-fade-in animated-duration-1000 animated-delay-1200">
        <h2 className="text-3xl font-bold text-[#05d9e8] mb-6 font-mono text-center glow glow-blue-500-sm animated-fade-in-down animated-duration-1000">Repository Components</h2>
        <div className="bg-blue-900/20 border-l-4 border-[#05d9e8] rounded-tr-md p-4 relative overflow-hidden glow glow-blue-500-md">
          <div className="absolute inset-0 bg-cyber-grid bg-[length:15px_15px] opacity-10 z-0"></div>

          <p className="text-blue-50 leading-relaxed animated-fade-in animated-delay-100 mb-4">
            Browse, search, and interact with repositories stored on the blockchain.
            WalGit provides a familiar interface with futuristic capabilities.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Repository View Component */}
            <div className="relative rounded-md overflow-hidden">
              <div className="absolute inset-0 bg-scanline-pattern opacity-10 pointer-events-none z-10"></div>
              <div className="flex items-center mb-2 justify-between">
                <span className="text-xs py-1 px-2 rounded-md bg-[#05d9e8]/20 text-[#05d9e8] border border-[#05d9e8]/30">
                  TypeScript/React
                </span>
                <button 
                  className="text-xs py-1 px-2 rounded-md bg-black/30 text-gray-300 hover:bg-black/50 transition-colors duration-200 flex items-center gap-1"
                  onClick={() => copyToClipboard(`// Repository view component
export function RepositoryView({ repo }) {
  const [branch, setBranch] = useState('main');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchFiles(repo.id, branch);
  }, [repo, branch]);

  return (
    <div className="repo-container">
      <h2>{repo.name}</h2>
      {/* Repository content */}
    </div>
  );
}`, 'repo-view')}
                >
                  {copied['repo-view'] ? 'Copied!' : 'Copy'}
                  <Copy size={12} />
                </button>
              </div>
              <CyberpunkTerminal 
                code={`// Repository view component
export function RepositoryView({ repo }) {
  const [branch, setBranch] = useState('main');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchFiles(repo.id, branch);
  }, [repo, branch]);

  return (
    <div className="repo-container">
      <h2>{repo.name}</h2>
      {/* Repository content */}
    </div>
  );
}`}
                language="tsx"
                title="repository-view.tsx"
                showLineNumbers={true}
                className="glow glow-blue-500-sm"
              />
            </div>

            {/* Commit History Component */}
            <div className="space-y-2 font-mono text-xs bg-black/50 rounded p-3 border border-[#05d9e8]/30 relative">
              <div className="flex items-center mb-2 justify-between">
                <span className="text-xs py-1 px-2 rounded-md bg-[#05d9e8]/20 text-[#05d9e8] border border-[#05d9e8]/30">
                  Commit History
                </span>
              </div>
              <div className="absolute inset-0 bg-scanline-subtle opacity-5 pointer-events-none"></div>
              <div className="flex items-start border-l-2 border-[#05d9e8] pl-3 pb-2 animated-fade-in-right animated-delay-100">
                <div className="text-[#05d9e8] mr-2 glow glow-blue-400-sm">→</div>
                <div>
                  <div className="text-white animated-pulse animated-duration-3000">feat: Add blockchain integration</div>
                  <div className="text-gray-500 text-[10px]">Committed by <span className="text-[#05d9e8] glow glow-blue-400-sm">0x7f3a...</span></div>
                  <div className="text-gray-500 text-[10px]">4 hours ago</div>
                </div>
              </div>
              <div className="flex items-start border-l-2 border-[#00ff9f] pl-3 pb-2 animated-fade-in-right animated-delay-200">
                <div className="text-[#00ff9f] mr-2 glow glow-green-400-sm">→</div>
                <div>
                  <div className="text-white">fix: Resolve merge conflicts</div>
                  <div className="text-gray-500 text-[10px]">Committed by <span className="text-[#00ff9f] glow glow-green-400-sm">0x7f3a...</span></div>
                  <div className="text-gray-500 text-[10px]">1 day ago</div>
                </div>
              </div>
              <div className="flex items-start border-l-2 border-[#ff2a6d] pl-3 animated-fade-in-right animated-delay-300">
                <div className="text-[#ff2a6d] mr-2 glow glow-red-400-sm">→</div>
                <div>
                  <div className="text-white">Initial commit</div>
                  <div className="text-gray-500 text-[10px]">Committed by <span className="text-[#ff2a6d] glow glow-red-400-sm">0x7f3a...</span></div>
                  <div className="text-gray-500 text-[10px]">2 days ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Contract Example */}
      <section className="w-full max-w-4xl mx-auto mb-12 animated-fade-in animated-duration-1000 animated-delay-1300">
        <h2 className="text-3xl font-bold text-[#bf5af2] mb-6 font-mono text-center glow glow-purple-500-sm animated-fade-in-down animated-duration-1000">Smart Contract Code</h2>
        <div className="relative rounded-md overflow-hidden">
          <div className="absolute inset-0 bg-scanline-pattern opacity-10 pointer-events-none z-10"></div>
          <div className="flex items-center mb-2">
            <span className="text-xs py-1 px-2 rounded-md bg-[#bf5af2]/20 text-[#bf5af2] border border-[#bf5af2]/30">
              Move
            </span>
            <button 
              className="ml-auto text-xs py-1 px-2 rounded-md bg-black/30 text-gray-300 hover:bg-black/50 transition-colors duration-200 flex items-center gap-1"
              onClick={() => copyToClipboard(`module walgit::git_blob_object {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::table::{Self, Table};
    use std::vector;
    use walgit::storage::{Self, StorageQuota};

    struct BlobObject has key {
        id: UID,
        hash: vector<u8>,
        content: vector<u8>,
        owner: address,
        size: u64,
    }

    public fun create_blob(
        content: vector<u8>,
        hash: vector<u8>, 
        storage_quota: &mut StorageQuota,
        ctx: &mut TxContext
    ): BlobObject {
        let size = vector::length(&content);
        storage::consume_quota(storage_quota, size);

        BlobObject {
            id: object::new(ctx),
            hash,
            content,
            owner: tx_context::sender(ctx),
            size,
        }
    }
}`, 'move-code')}
            >
              {copied['move-code'] ? 'Copied!' : 'Copy'}
              <Copy size={12} />
            </button>
          </div>
          <CyberpunkTerminal 
            code={`module walgit::git_blob_object {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::table::{Self, Table};
    use std::vector;
    use walgit::storage::{Self, StorageQuota};

    struct BlobObject has key {
        id: UID,
        hash: vector<u8>,
        content: vector<u8>,
        owner: address,
        size: u64,
    }

    public fun create_blob(
        content: vector<u8>,
        hash: vector<u8>, 
        storage_quota: &mut StorageQuota,
        ctx: &mut TxContext
    ): BlobObject {
        let size = vector::length(&content);
        storage::consume_quota(storage_quota, size);

        BlobObject {
            id: object::new(ctx),
            hash,
            content,
            owner: tx_context::sender(ctx),
            size,
        }
    }
}`}
            language="rust"
            title="git_blob_object.move"
            showLineNumbers={true}
            className="glow glow-purple-500-sm"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-gray-800 mt-16 text-center animated-fade-in animated-duration-1000 animated-delay-1500">
        <div className="relative">
          <div className="absolute inset-0 bg-cyber-grid-large bg-[length:30px_30px] opacity-10 z-0"></div>
          <p className="text-gray-400 relative z-10 font-mono">
            <span className="text-[#05d9e8] glow glow-blue-400-sm">WalGit</span> <span className="text-[#00ff9f] glow glow-green-400-sm">Decentralized Version Control</span>
          </p>
          <div className="flex justify-center gap-4 mt-4 relative z-10">
            <Button variant="outline" size="sm" className="border-[#05d9e8] text-[#05d9e8] hover:bg-[#05d9e8]/10 glow-on-hover glow-[#05d9e8]-sm animated-bounce-sm">
              Documentation
            </Button>
            <Button variant="outline" size="sm" className="border-[#00ff9f] text-[#00ff9f] hover:bg-[#00ff9f]/10 glow-on-hover glow-[#00ff9f]-sm animated-bounce-sm">
              GitHub
            </Button>
            <Button variant="outline" size="sm" className="border-[#ff2a6d] text-[#ff2a6d] hover:bg-[#ff2a6d]/10 glow-on-hover glow-[#ff2a6d]-sm animated-bounce-sm">
              Discord
            </Button>
          </div>

          {/* Cyber accent line */}
          <div className="h-px w-full max-w-md mx-auto bg-gradient-to-r from-transparent via-[#05d9e8] to-transparent my-8 opacity-70 animate-pulse-slow"></div>

          {/* Copyright */}
          <p className="text-xs text-gray-600 relative z-10 font-mono animated-fade-in animated-delay-200">
            © 2025 WalGit • Secured by <span className="text-[#05d9e8] glow glow-blue-400-sm">Sui</span> Blockchain
          </p>
        </div>
      </footer>

      {/* Fixed circuit elements in corners for decoration */}
      <div className="fixed top-0 left-0 w-32 h-32 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full border-b border-r border-[#05d9e8]/30"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 border-t border-l border-[#05d9e8]/30"></div>
      </div>
      <div className="fixed bottom-0 right-0 w-32 h-32 opacity-20 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-full h-full border-t border-l border-[#ff2a6d]/30"></div>
        <div className="absolute top-0 left-0 w-1/2 h-1/2 border-b border-r border-[#ff2a6d]/30"></div>
      </div>
    </main>
  );
}