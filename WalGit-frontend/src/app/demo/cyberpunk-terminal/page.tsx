'use client';

import { CyberpunkTerminal } from '@/components/ui/cyberpunk-terminal';
import { ResponsiveCyberpunkButton } from '@/components/ui/responsive-cyberpunk-ui';
import Link from 'next/link';

export default function CyberpunkTerminalDemo() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/demo">
          <ResponsiveCyberpunkButton variant="cyberGlitch" size="sm" className="mb-4">
            ← Back to Demos
          </ResponsiveCyberpunkButton>
        </Link>
        <h1 className="text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-[#05d9e8] to-[#ff2a6d] bg-clip-text text-transparent">
            Cyberpunk Terminal
          </span>
        </h1>
        <p className="text-gray-400">Interactive terminal with hacker-style interface</p>
      </div>

      <div className="h-[600px]">
        <CyberpunkTerminal
          code={`// Welcome to WalGit Terminal v1.0.0
// Type 'help' for available commands

$ walgit init
Initializing new WalGit repository...
✓ Created .walgit directory
✓ Connected to Sui blockchain
✓ Configured Walrus storage
Repository initialized successfully!

$ walgit status
On branch main
No commits yet

nothing to commit (create/copy files and use "walgit add" to track)

$ walgit add README.md
$ walgit commit -m "Initial commit"
[main 7d3f8a9] Initial commit
 1 file changed, 42 insertions(+)
 create mode 100644 README.md

$ walgit push origin main
Pushing to decentralized storage...
✓ Encrypted with Seal
✓ Uploaded to Walrus
✓ Transaction recorded on Sui
Push completed successfully!`}
          language="bash"
          title="terminal@walgit:~$"
          animateTyping={true}
          showLineNumbers={false}
          className="h-full"
        />
      </div>
    </div>
  );
}