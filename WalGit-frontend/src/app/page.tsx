'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CyberpunkTerminal } from '@/components/ui/cyberpunk-terminal';
import { GitBranch, ArrowRight, ShieldCheck, Globe, Copy, Code, Server, Database, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useWalletConnection } from '@/hooks/use-wallet-connection';

export default function HomePage() {
  const [copied, setCopied] = useState<{[key: string]: boolean}>({});
  const { isConnected, isConnecting, hasWallets, wallets, connect, currentAccount } = useWalletConnection();
  
  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied({ ...copied, [id]: true });
    setTimeout(() => setCopied({ ...copied, [id]: false }), 2000);
  };
  
  return (
    <div className="flex min-h-screen flex-col dark bg-[#0d1117]">
      {/* Hero Section - GitHub inspired with cyberpunk aesthetic */}
      <section className="relative pt-16 pb-10 overflow-hidden border-b border-[#21262d]">
        {/* Subtle grid background with cyberpunk elements */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 z-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#161b22]/90 to-[#0d1117] z-0" />
        
        {/* Animated circuit lines - cyberpunk element */}
        <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
          <svg width="100%" height="100%" className="absolute">
            <line x1="0" y1="20%" x2="100%" y2="40%" stroke="var(--neon-blue)" strokeWidth="1" strokeDasharray="5,10" className="animate-pulse-subtle" />
            <line x1="100%" y1="10%" x2="0" y2="85%" stroke="var(--neon-purple)" strokeWidth="1" strokeDasharray="6,12" className="animate-pulse-subtle" style={{ animationDelay: '0.5s' }} />
          </svg>
        </div>
        
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Left side - Main content */}
            <div className="flex-1 max-w-[640px]">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold mb-6 text-white leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)]">
                  WalGit
                </span>{' '}
                <span className="text-white">Decentralized Version Control</span>
              </h1>
              
              <p className="text-lg text-[#8b949e] mb-8">
                Built on <span className="text-[var(--neon-teal)]">Sui</span> and <span className="text-[var(--neon-purple)]">Walrus</span> for Storage, 
                providing secure, transparent, and decentralized code management.
                <span className="block mt-2 text-sm italic">[Alpha Release - Some features not yet available]</span>
              </p>
              
              <div className="flex flex-wrap gap-4 mb-10">
                {!isConnected ? (
                  <div className="relative group overflow-hidden">
                    <button 
                      onClick={() => {
                        console.log('Connect wallet clicked');
                        if (!hasWallets) {
                          console.warn('No wallets detected. Please install a Sui wallet.');
                          return;
                        }
                        console.log('Available wallets:', wallets.map(w => w.name));
                        connect(); // Connect to first available wallet
                      }}
                      disabled={isConnecting}
                      className="relative overflow-hidden z-10 px-6 py-3 min-w-[180px] bg-black border border-[#0ff] text-[#0ff] font-medium text-md rounded-sm
                        shadow-[0_0_10px_rgba(0,255,255,0.5)] hover:shadow-[0_0_20px_rgba(0,255,255,0.8)]
                        transition-all duration-300 hover:-translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed">
                      
                      {/* Background glow effect */}
                      <div className="absolute inset-0 bg-[#0ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Bottom line animation */}
                      <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#0ff] via-[#f0f] to-[#0ff] 
                        group-hover:w-full transition-all duration-500"></div>
                        
                      {/* Text with its own glow */}
                      <div className="relative z-10 flex items-center justify-center text-shadow-[0_0_5px_rgba(0,255,255,0.5)]">
                        <Wallet className="mr-2 h-4 w-4" />
                        {isConnecting ? 'Connecting...' : hasWallets ? 'Connect Wallet' : 'Install Wallet'}
                      </div>
                    </button>
                    
                    {/* Scanline overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_50%,rgba(0,0,0,0.1)_50%,transparent_51%,transparent_100%)] bg-[length:100%_4px] opacity-0 group-hover:opacity-30"></div>
                    
                    {/* Glitch animation on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 animate-[glitch-effect_2.5s_infinite] z-20 pointer-events-none"></div>
                  </div>
                ) : (
                  <>
                    <Link href="/new-repository">
                      <div className="relative group overflow-hidden">
                        {/* Glitch effect container */}
                        <button className="relative overflow-hidden z-10 px-6 py-3 min-w-[180px] bg-black border border-[#0ff] text-[#0ff] font-medium text-md rounded-sm
                          shadow-[0_0_10px_rgba(0,255,255,0.5)] hover:shadow-[0_0_20px_rgba(0,255,255,0.8)]
                          transition-all duration-300 hover:-translate-y-[2px]">
                          
                          {/* Background glow effect */}
                          <div className="absolute inset-0 bg-[#0ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Bottom line animation */}
                          <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#0ff] via-[#f0f] to-[#0ff] 
                            group-hover:w-full transition-all duration-500"></div>
                            
                          {/* Text with its own glow */}
                          <div className="relative z-10 flex items-center justify-center text-shadow-[0_0_5px_rgba(0,255,255,0.5)]">
                            Create Repository <ArrowRight className="ml-2 h-4 w-4" />
                          </div>
                        </button>
                        
                        {/* Scanline overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_50%,rgba(0,0,0,0.1)_50%,transparent_51%,transparent_100%)] bg-[length:100%_4px] opacity-0 group-hover:opacity-30"></div>
                        
                        {/* Glitch animation on hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 animate-[glitch-effect_2.5s_infinite] z-20 pointer-events-none"></div>
                      </div>
                    </Link>
                    
                    <Link href="/repositories">
                      <div className="relative group overflow-hidden">
                        {/* Terminal-like hacker button */}
                        <button className="relative overflow-hidden z-10 px-6 py-3 min-w-[180px] bg-black font-mono font-medium text-md
                          border-l-[2px] border-r-[2px] border-[#0f0] text-[#0f0] rounded-none
                          transition-all duration-300 hover:bg-[#0f0]/5">
                          
                          {/* Left blinking cursor effect */}
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-4 bg-[#0f0] opacity-70 animate-[blink-cursor_1.2s_step-end_infinite]"></div>
                          
                          {/* Text with terminal effect */}
                          <div className="relative z-10 flex items-center justify-center pl-2">
                            <span className="font-mono tracking-wide">$ cd /explore-projects</span>
                          </div>
                        </button>
                        
                        {/* Terminal scanline effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,transparent,rgba(0,255,0,0.2),transparent,transparent)] opacity-0 group-hover:opacity-30 bg-[length:100%_100%] group-hover:animate-[scanline-scroll_var(--animation-duration,3s)_ease-in-out_infinite]"></div>
                      </div>
                    </Link>
                  </>
                )}
              </div>
              
              {/* Stats with cyberpunk styling */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-[#8b949e]">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-[var(--neon-blue)] mr-2 animate-pulse"></div>
                  <span>100% Open Source</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-[var(--neon-teal)] mr-2 animate-pulse"></div>
                  <span>Sui Blockchain Integration <span className="text-xs ml-1">[Beta]</span></span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-[var(--neon-purple)] mr-2 animate-pulse"></div>
                  <span>Decentralized Storage <span className="text-xs ml-1">[Testing]</span></span>
                </div>
              </div>
            </div>
            
            {/* Right side - Terminal visualization */}
            <div className="flex-1 max-w-[600px] w-full relative">
              {/* Glowing border - cyberpunk element */}
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)] blur-md opacity-50 animate-pulse-subtle"></div>
              
              <div className="relative rounded-lg border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-2xl">
                {/* Terminal header */}
                <div className="flex items-center gap-1.5 px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="flex items-center gap-2">
                    <Image 
                    src="/walgitlogo.png" 
                    alt="WalGit Logo" 
                    width={12}
                    height={12}
                    className="rounded-full" 
                    style={{ objectFit: 'cover' }} 
                  />
                    <p className="text-xs text-[#8b949e] font-mono">terminal@walgit:~</p>
                  </div>
                </div>
                
                {/* Terminal content */}
                <div className="relative rounded-b-lg overflow-hidden">
                  <div className="absolute inset-0 bg-scanline-pattern opacity-5 pointer-events-none"></div>
                  <CyberpunkTerminal 
                    code={`# Initialize a new WalGit repository
$ walgit init my-project
Initializing repository at ./my-project...
Repository created successfully!

# Connect your wallet
$ walgit wallet connect
Wallet connected: 0x7f3a9e4b8c...

# Add and commit files
$ walgit add .
$ walgit commit -m "Initial commit"
[main (root-commit)] Commit 0x1f2a3b4c: Initial commit
 3 files changed, 124 insertions(+)

# Push to the blockchain
$ walgit push origin main
Pushing to blockchain...
Storing blobs via Walrus...
Success! Transaction ID: 0xd5e6f7a8b9...`}
                    language="bash"
                    title=""
                    showLineNumbers={false}
                    animateTyping={true}
                    className="p-4"
                  />
                </div>
              </div>
              
              {/* Glow effects - cyberpunk element */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-[var(--neon-blue)] opacity-10 blur-3xl"></div>
              <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-[var(--neon-purple)] opacity-10 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Feature boxes - GitHub inspired with cyberpunk styling */}
      <section className="py-16 relative z-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">
            <span className="relative">
              The Complete Git Experience, Enhanced with Blockchain Technology
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--neon-blue)] to-transparent"></span>
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature card 1 */}
            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-6 transition-all duration-300 transform hover:translate-y-[-5px] hover:shadow-[0_0_20px_rgba(0,238,255,0.2)]">
              <div className="h-12 w-12 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center mb-4 relative">
                <Image 
                  src="/walgitlogo.png" 
                  alt="WalGit Logo" 
                  width={12}
                  height={12}
                  className="absolute top-1 left-1 rounded-full"
                  style={{ objectFit: 'cover' }} 
                />
                <Code className="h-6 w-6 text-[var(--neon-blue)]" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white mb-2">Decentralized Repositories</h3>
                <span className="text-xs text-[var(--neon-blue)] px-2 py-0.5 rounded-full border border-[var(--neon-blue)]/30">Active</span>
              </div>
              <p className="text-[#8b949e] mb-4">
                Store your code on the blockchain with fully decentralized file storage integration
              </p>
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-[var(--neon-blue)] to-transparent opacity-30"></div>
            </div>
            
            {/* Feature card 2 */}
            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-6 transition-all duration-300 transform hover:translate-y-[-5px] hover:shadow-[0_0_20px_rgba(0,255,179,0.2)]">
              <div className="h-12 w-12 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center mb-4 relative">
                <Image 
                  src="/walgitlogo.png" 
                  alt="WalGit Logo" 
                  width={12}
                  height={12}
                  className="absolute top-1 left-1 rounded-full"
                  style={{ objectFit: 'cover' }} 
                />
                <Server className="h-6 w-6 text-[var(--neon-teal)]" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white mb-2">Immutable Commit History</h3>
                <span className="text-xs text-[var(--neon-teal)] px-2 py-0.5 rounded-full border border-[var(--neon-teal)]/30">Beta</span>
              </div>
              <p className="text-[#8b949e] mb-4">
                Every code change is cryptographically secured and permanently recorded
              </p>
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-[var(--neon-teal)] to-transparent opacity-30"></div>
            </div>
            
            {/* Feature card 3 */}
            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-6 transition-all duration-300 transform hover:translate-y-[-5px] hover:shadow-[0_0_20px_rgba(217,0,255,0.2)]">
              <div className="h-12 w-12 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center mb-4 relative">
                <Image 
                  src="/walgitlogo.png" 
                  alt="WalGit Logo" 
                  width={12}
                  height={12}
                  className="absolute top-1 left-1 rounded-full"
                  style={{ objectFit: 'cover' }} 
                />
                <Database className="h-6 w-6 text-[var(--neon-purple)]" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white mb-2">Smart Contracts</h3>
                <span className="text-xs text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">Not in use</span>
              </div>
              <p className="text-[#8b949e] mb-4">
                Leverage blockchain&apos;s smart contracts for code reviews and merges (Coming Soon)
              </p>
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-[var(--neon-purple)] to-transparent opacity-30"></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Repository showcase with terminal - GitHub inspired with cyberpunk elements */}
      <section className="py-16 bg-[#161b22] border-y border-[#30363d] relative">
        {/* Subtle cyberpunk background elements */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 z-0"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--neon-blue)]/30 to-transparent animate-scanner"></div>
        </div>
        
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-semibold text-white">Repository Management</h2>
            <span className="text-xs bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] px-2 py-0.5 rounded border border-[var(--neon-blue)]/30">
              Development Preview
            </span>
          </div>
          <p className="text-[#8b949e] mb-8 max-w-2xl">
            Browse, search, and interact with repositories stored on the blockchain.
            WalGit provides a familiar interface with futuristic capabilities.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left panel - Repository tree */}
            <div className="rounded-lg border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-lg">
              <div className="border-b border-[#30363d] px-4 py-3 bg-[#161b22] text-white font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image 
                    src="/walgitlogo.png" 
                    alt="WalGit Logo" 
                    width={12}
                    height={12}
                    className="rounded-full" 
                    style={{ objectFit: 'cover' }} 
                  />
                  <span>walgit-core</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#8b949e]">
                  <GitBranch className="h-4 w-4" />
                  <span>main</span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-2 text-white mb-4">
                  <span className="inline-block w-3 h-3 bg-[var(--neon-blue)] rounded-full"></span>
                  <span className="text-sm font-mono">Latest commit: Enhance blob storage integration</span>
                </div>
                
                {/* File tree with cyberpunk styling */}
                <div className="font-mono text-sm space-y-2">
                  <div className="flex items-center text-[#8b949e] hover:bg-[#161b22] p-1.5 rounded transition-colors">
                    <span className="text-[var(--neon-blue)]">┣━</span> .github/
                  </div>
                  <div className="flex items-center text-[#8b949e] hover:bg-[#161b22] p-1.5 rounded transition-colors">
                    <span className="text-[var(--neon-teal)]">┣━</span> src/
                  </div>
                  <div className="flex items-center text-[#8b949e] hover:bg-[#161b22] p-1.5 rounded transition-colors pl-6">
                    <span className="text-[var(--neon-teal)]">┣━</span> components/
                  </div>
                  <div className="flex items-center text-[#8b949e] hover:bg-[#161b22] p-1.5 rounded transition-colors pl-6">
                    <span className="text-[var(--neon-teal)]">┣━</span> utils/
                  </div>
                  <div className="flex items-center text-[#8b949e] hover:bg-[#161b22] p-1.5 rounded transition-colors pl-12">
                    <span className="text-[var(--neon-purple)]">┣━</span> blockchain-transaction-handler.js
                  </div>
                  <div className="flex items-center text-[#8b949e] hover:bg-[#161b22] p-1.5 rounded transition-colors pl-12">
                    <span className="text-[var(--neon-purple)]">┣━</span> blob-manager.js
                  </div>
                  <div className="flex items-center text-[#8b949e] hover:bg-[#161b22] p-1.5 rounded transition-colors">
                    <span className="text-[var(--neon-blue)]">┣━</span> .gitignore
                  </div>
                  <div className="flex items-center text-[#8b949e] hover:bg-[#161b22] p-1.5 rounded transition-colors">
                    <span className="text-[var(--neon-blue)]">┣━</span> package.json
                  </div>
                  <div className="flex items-center text-[#8b949e] hover:bg-[#161b22] p-1.5 rounded transition-colors">
                    <span className="text-[var(--neon-blue)]">┗━</span> README.md
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right panel - Code with terminal styling */}
            <div className="rounded-lg border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-lg">
              <div className="flex items-center justify-between border-b border-[#30363d] px-4 py-3 bg-[#161b22]">
                <div className="flex items-center gap-2">
                  <Image 
                    src="/walgitlogo.png" 
                    alt="WalGit Logo" 
                    width={12}
                    height={12}
                    className="rounded-full" 
                    style={{ objectFit: 'cover' }} 
                  />
                  <span className="text-white font-medium">blob-manager.js</span>
                </div>
                <button 
                  className="text-xs py-1 px-2 rounded-md bg-[#30363d]/50 text-[#8b949e] hover:bg-[#30363d] transition-colors flex items-center gap-1"
                  onClick={() => copyToClipboard(`// Repository blob manager
class BlobManager {
  constructor(walrusClient, suiClient) {
    this.walrusClient = walrusClient;
    this.suiClient = suiClient;
  }

  async storeBlob(content, options = {}) {
    // Calculate content hash
    const hash = await this.calculateHash(content);
    
    // Store in multi-tier system
    const walrusRef = await this.walrusClient.store(content);
    const txn = await this.suiClient.moveCall({
      target: \`\${packageId}::git_blob_object::create_blob\`,
      arguments: [
        content, 
        hash,
        options.storageQuota || this.defaultQuota
      ]
    });
    
    return { 
      hash,
      walrusRef,
      transaction: txn
    };
  }
}`, 'blob-manager')}>
                  {copied['blob-manager'] ? 'Copied!' : 'Copy'} <Copy size={12} />
                </button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-scanline-pattern opacity-5 pointer-events-none"></div>
                <CyberpunkTerminal 
                  code={`// Repository blob manager
class BlobManager {
  constructor(walrusClient, suiClient) {
    this.walrusClient = walrusClient;
    this.suiClient = suiClient;
  }

  async storeBlob(content, options = {}) {
    // Calculate content hash
    const hash = await this.calculateHash(content);
    
    // Store in multi-tier system
    const walrusRef = await this.walrusClient.store(content);
    const txn = await this.suiClient.moveCall({
      target: \`\${packageId}::git_blob_object::create_blob\`,
      arguments: [
        content, 
        hash,
        options.storageQuota || this.defaultQuota
      ]
    });
    
    return { 
      hash,
      walrusRef,
      transaction: txn
    };
  }
}`}
                  language="javascript"
                  title=""
                  showLineNumbers={true}
                  className="p-0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to action section - GitHub inspired with cyberpunk elements */}
      <section className="py-16 relative">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 md:px-8 text-center">
          <div className="inline-block mb-2 px-3 py-1 rounded-full bg-[var(--neon-purple)]/10 border border-[var(--neon-purple)]/30">
            <span className="text-sm text-[var(--neon-purple)]">Early Access</span>
          </div>
          <h2 className="text-3xl font-semibold mb-4 text-white">Ready to join the waitlist?</h2>
          <p className="text-[#8b949e] mb-8">
            Be among the first to experience the next generation of version control with WalGit. 
            Decentralized, secure, and built for the future.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/home">
              <div className="relative group overflow-hidden rounded-md">
                {/* Holographic button with prismatic effects */}
                <button className="relative overflow-hidden z-10 px-8 py-4 min-w-[200px] bg-gradient-to-tr from-indigo-900/30 via-cyan-900/20 to-purple-900/30 backdrop-blur-sm font-medium text-lg
                  border border-white/20 text-white/90 rounded-md
                  transition-all duration-300 hover:-translate-y-[2px]">
                  
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0ff]/0 via-[#0ff]/20 to-[#f0f]/0
                    opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                  
                  {/* Holographic text with glow effect */}
                  <div className="relative z-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-pink-300 to-blue-300
                    group-hover:from-blue-200 group-hover:via-pink-200 group-hover:to-blue-200
                    text-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:text-shadow-[0_0_12px_rgba(255,255,255,1)]">
                    Join Waitlist
                  </div>
                  
                  {/* Thin highlight lines */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                </button>
                
                {/* Holographic flicker effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 animate-[hologram-flicker_3s_infinite]"></div>
                
                {/* Prismatic edge glow only on hover */}
                <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-500"></div>
              </div>
            </Link>
            
            <Link href="/home">
              <div className="relative group overflow-hidden">
                {/* Neon magenta button */}
                <button className="relative overflow-hidden z-10 px-8 py-4 min-w-[200px] bg-black font-medium text-lg
                  border-[1.5px] border-[#f0f] text-[#f0f] rounded-sm
                  transition-all duration-300 hover:scale-[1.02]
                  shadow-[0_0_10px_rgba(255,0,255,0.5)] hover:shadow-[0_0_15px_rgba(255,0,255,0.8)]">
                  
                  {/* Glowing background on hover */}
                  <div className="absolute inset-0 bg-[#f0f]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Moving glow effect from left to right */}
                  <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-[#f0f]/20 to-transparent group-hover:left-[100%] transition-all duration-1000 ease-in-out"></div>
                  
                  {/* Text content with layout */}
                  <div className="relative z-10 flex items-center justify-center">
                    <span className="text-xs opacity-70 font-mono mr-2 group-hover:opacity-90 transition-opacity">[VIEW{'//'}</span>
                    <span className="text-shadow-[0_0_5px_rgba(255,0,255,0.7)] group-hover:text-shadow-[0_0_10px_rgba(255,0,255,1)] transition-all duration-300">Tech Demo</span>
                    <span className="text-xs opacity-70 font-mono ml-2 group-hover:opacity-90 transition-opacity">{'//'}BETA]</span>
                  </div>
                </button>
                
                {/* Electric border effect on top and bottom */}
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#f0f] group-hover:w-full transition-all duration-500 delay-100"></div>
                <div className="absolute top-0 right-0 w-0 h-[2px] bg-[#f0f] group-hover:w-full transition-all duration-500 delay-100"></div>
              </div>
            </Link>
          </div>
          
          {/* Cyberpunk accent line */}
          <div className="h-px w-full max-w-md mx-auto bg-gradient-to-r from-transparent via-[var(--neon-blue)] to-transparent my-12 opacity-40"></div>
          
          <div className="flex items-center justify-center gap-2">
            <Image 
              src="/walgitlogo.png" 
              alt="WalGit Logo" 
              width={12}
              height={12}
              className="rounded-full"
              style={{ objectFit: 'cover' }} 
            />
            <p className="text-sm text-[#8b949e] font-mono">
              <span className="text-[var(--neon-blue)]">WalGit</span> • Built on <span className="text-[var(--neon-teal)]">Sui</span> with <span className="text-[var(--neon-purple)]">Walrus</span> Storage • <span className="text-gray-500">Alpha v0.1.0</span>
            </p>
          </div>
        </div>
        
        {/* Cyberpunk glow effects */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-80 h-80 rounded-full bg-[var(--neon-blue)] opacity-5 blur-3xl"></div>
      </section>
    </div>
  );
}