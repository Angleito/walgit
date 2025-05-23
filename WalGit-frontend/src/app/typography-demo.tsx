'use client';

import React from 'react';
import { NeonText } from '@/components/ui/neon-text';
import { TypographyShowcase } from '@/components/ui/typography-showcase';

/**
 * Example page demonstrating the enhanced typography system
 */
export default function TypographyDemoPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <NeonText 
          as="h1" 
          size="5xl" 
          color="cyberBlue" 
          font="display"
          alignment="center"
          weight="extrabold"
          underline="none"
          flicker="subtle"
        >
          WalGit Typography System
        </NeonText>
        
        <div className="mt-4 max-w-3xl mx-auto">
          <NeonText 
            as="p" 
            size="xl" 
            color="blueSubdued"
            font="body"
            weight="medium"
            alignment="center"
          >
            A comprehensive typography system designed for the cyberpunk-themed decentralized version control platform
          </NeonText>
        </div>
      </header>

      {/* Example real-world usage section */}
      <section className="mb-16">
        <div className="p-8 bg-black/40 cyber-clip cyberpunk-border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <NeonText 
                as="h2" 
                size="3xl" 
                color="cyberTeal" 
                underline="gradient"
                letterSpacing="wide"
              >
                Repository Overview
              </NeonText>
              
              <div className="mt-6 space-y-4">
                <NeonText as="h3" size="xl" color="teal" font="display">
                  WalGit Main Repository
                </NeonText>
                
                <NeonText as="p" size="base" color="blueSubdued" font="body" weight="normal">
                  The main repository for the WalGit project, containing the core source code for the decentralized version control system built on the Sui blockchain.
                </NeonText>
                
                <div className="mt-8">
                  <div className="flex items-center space-x-4">
                    <div className="h-3 w-3 rounded-full bg-neon-blue"></div>
                    <NeonText as="span" size="sm" color="blue" font="body">
                      Active Contributors: 24
                    </NeonText>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="h-3 w-3 rounded-full bg-neon-teal"></div>
                    <NeonText as="span" size="sm" color="teal" font="body">
                      Last Commit: 2 hours ago
                    </NeonText>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="h-3 w-3 rounded-full bg-neon-purple"></div>
                    <NeonText as="span" size="sm" color="violet" font="body">
                      Open Pull Requests: 7
                    </NeonText>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-4">
                  <button className="py-2 px-6 bg-transparent border border-neon-blue text-neon-blue rounded-md hover:bg-neon-blue/10 transition-colors">
                    View Details
                  </button>
                  <button className="py-2 px-6 bg-transparent border border-neon-teal text-neon-teal rounded-md hover:bg-neon-teal/10 transition-colors">
                    Clone Repository
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <NeonText 
                as="h2" 
                size="3xl" 
                color="cyberPink" 
                underline="gradient"
                letterSpacing="wide"
              >
                Recent Activity
              </NeonText>
              
              <div className="mt-6 space-y-6">
                <div className="border-b border-gray-800 pb-4">
                  <NeonText as="h4" size="lg" color="pink" font="display">
                    Pull Request Merged
                  </NeonText>
                  
                  <NeonText as="p" size="base" color="blueSubdued" font="body" weight="normal">
                    <span className="text-neon-pink">@dev_user</span> merged pull request <span className="text-neon-teal">#142</span>: Add enhanced wallet integration
                  </NeonText>
                  
                  <NeonText as="p" size="sm" color="pinkSubdued" font="body" weight="normal" className="mt-1">
                    3 hours ago
                  </NeonText>
                </div>
                
                <div className="border-b border-gray-800 pb-4">
                  <NeonText as="h4" size="lg" color="blue" font="display">
                    New Branch Created
                  </NeonText>
                  
                  <NeonText as="p" size="base" color="blueSubdued" font="body" weight="normal">
                    <span className="text-neon-blue">@lead_dev</span> created branch <span className="text-neon-teal">feature/optimized-storage</span>
                  </NeonText>
                  
                  <NeonText as="p" size="sm" color="blueSubdued" font="body" weight="normal" className="mt-1">
                    5 hours ago
                  </NeonText>
                </div>
                
                <div className="border-b border-gray-800 pb-4">
                  <NeonText as="h4" size="lg" color="teal" font="display">
                    Code Review Completed
                  </NeonText>
                  
                  <NeonText as="p" size="base" color="blueSubdued" font="body" weight="normal">
                    <span className="text-neon-teal">@code_reviewer</span> approved changes in <span className="text-neon-purple">PR #139</span>
                  </NeonText>
                  
                  <NeonText as="p" size="sm" color="tealSubdued" font="body" weight="normal" className="mt-1">
                    7 hours ago
                  </NeonText>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alert example */}
      <section className="mb-16">
        <div className="max-w-3xl mx-auto">
          <div className="p-6 border border-neon-blue bg-black/40 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon-blue"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <div>
                <NeonText as="h3" size="lg" color="blue" font="display" weight="bold">
                  Information Alert
                </NeonText>
                <NeonText as="p" size="base" color="blueSubdued" font="body" weight="normal" className="mt-1">
                  This is an example of an information alert using our typography system. Notice how the colors and fonts create a consistent, readable experience.
                </NeonText>
              </div>
            </div>
          </div>
          
          <div className="p-6 border border-neon-pink bg-black/40 rounded-lg mt-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon-pink"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <div>
                <NeonText as="h3" size="lg" color="pink" font="display" weight="bold">
                  Warning Alert
                </NeonText>
                <NeonText as="p" size="base" color="pinkSubdued" font="body" weight="normal" className="mt-1">
                  This warning alert demonstrates how we use the neon pink color for attention-grabbing elements. The combination of Orbitron headers and Rajdhani body text creates visual hierarchy.
                </NeonText>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography showcase component */}
      <section>
        <div className="mb-8 text-center">
          <NeonText 
            as="h2" 
            size="4xl" 
            color="cyberPink" 
            font="display"
            alignment="center"
            flicker="subtle"
          >
            Typography Reference
          </NeonText>
          <div className="mt-2 max-w-2xl mx-auto">
            <NeonText 
              as="p" 
              size="lg" 
              color="violetSubdued"
              font="body"
              weight="normal"
              alignment="center"
            >
              Complete documentation of our typography system components and usage guidelines
            </NeonText>
          </div>
        </div>
        
        <TypographyShowcase />
      </section>
    </div>
  );
}