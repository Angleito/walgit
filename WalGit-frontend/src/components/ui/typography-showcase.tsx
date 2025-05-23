'use client';

import React from 'react';
import { NeonText } from './neon-text';

/**
 * Typography Showcase component that demonstrates the enhanced typography system
 * Useful for visual documentation and design system reference
 */
export function TypographyShowcase() {
  return (
    <div className="space-y-12 my-8 p-8 border border-gray-800 rounded-lg bg-black/30 cyber-clip cyberpunk-border">
      {/* Heading section */}
      <section>
        <div className="border-b border-gray-800 pb-2 mb-6">
          <NeonText as="h2" size="2xl" color="blue" underline="none">
            Typography Hierarchy
          </NeonText>
        </div>
        
        <div className="space-y-4">
          <NeonText as="h1" size="5xl" color="cyberBlue">Heading 1 - Orbitron</NeonText>
          <NeonText as="h2" size="4xl" color="cyberTeal">Heading 2 - Orbitron</NeonText>
          <NeonText as="h3" size="3xl" color="cyberPink">Heading 3 - Orbitron</NeonText>
          <NeonText as="h4" size="2xl" color="blue">Heading 4 - Orbitron</NeonText>
          <NeonText as="h5" size="xl" color="violet">Heading 5 - Orbitron</NeonText>
          <NeonText as="h6" size="lg" color="teal">Heading 6 - Orbitron</NeonText>
        </div>
      </section>

      {/* Body text section */}
      <section>
        <div className="border-b border-gray-800 pb-2 mb-6">
          <NeonText as="h2" size="2xl" color="violet" underline="none">
            Body Typography - Rajdhani
          </NeonText>
        </div>
        
        <div className="space-y-4">
          <NeonText as="p" size="lg" font="body" weight="normal" color="blue">
            Body text large - Perfect for important paragraphs and introductions. The Rajdhani font offers excellent readability with a technical feel that complements the cyberpunk aesthetic.
          </NeonText>
          
          <NeonText as="p" size="base" font="body" weight="normal" color="blueSubdued">
            Body text normal - Used for standard paragraphs and general content. Subdued colors provide good readability while maintaining the neon aesthetic without overwhelming the user.
          </NeonText>
          
          <NeonText as="p" size="sm" font="body" weight="normal" color="violetSubdued">
            Body text small - Ideal for secondary information, captions, and less important content that still needs to be readable.
          </NeonText>
        </div>
      </section>

      {/* Code text section */}
      <section>
        <div className="border-b border-gray-800 pb-2 mb-6">
          <NeonText as="h2" size="2xl" color="teal" underline="none">
            Code Typography - Inter
          </NeonText>
        </div>
        
        <div className="space-y-4 font-mono bg-black/50 p-4 rounded">
          <NeonText as="div" size="base" font="code" weight="normal" color="tealSubdued">
            <span className="text-neon-teal">const</span> <span className="text-blue-300">repository</span> = <span className="text-neon-pink">new</span> <span className="text-neon-purple">WalGitRepository</span>&#40;&#41;;
          </NeonText>
          <NeonText as="div" size="base" font="code" weight="normal" color="tealSubdued">
            <span className="text-neon-blue">repository</span>.<span className="text-blue-300">commit</span>&#40;<span className="text-green-300">&apos;Initial commit&apos;</span>&#41;;
          </NeonText>
        </div>
      </section>

      {/* Neon color usage section */}
      <section>
        <div className="border-b border-gray-800 pb-2 mb-6">
          <NeonText as="h2" size="2xl" color="pink" underline="none">
            Neon Color Usage
          </NeonText>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <NeonText as="h3" size="xl" color="blue" underline="gradient">Primary Actions</NeonText>
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-black/30 rounded cyber-clip">
                <NeonText as="p" font="body" size="base" weight="medium" color="blue">
                  Neon Blue - Primary CTAs and Actions
                </NeonText>
                <button className="mt-3 py-2 px-4 bg-transparent border border-neon-blue text-neon-blue hover:bg-neon-blue/10 rounded flex items-center">
                  <span className="mr-2">Create Repository</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <NeonText as="h3" size="xl" color="teal" underline="gradient">Secondary Elements</NeonText>
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-black/30 rounded cyber-clip">
                <NeonText as="p" font="body" size="base" weight="medium" color="teal">
                  Neon Teal - Secondary Elements and Success States
                </NeonText>
                <button className="mt-3 py-2 px-4 bg-transparent border border-neon-teal text-neon-teal hover:bg-neon-teal/10 rounded flex items-center">
                  <span className="mr-2">Commit Changes</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <NeonText as="h3" size="xl" color="pink" underline="gradient">Destructive Actions</NeonText>
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-black/30 rounded cyber-clip">
                <NeonText as="p" font="body" size="base" weight="medium" color="pink">
                  Neon Pink - Destructive Actions and Alerts
                </NeonText>
                <button className="mt-3 py-2 px-4 bg-transparent border border-neon-pink text-neon-pink hover:bg-neon-pink/10 rounded flex items-center">
                  <span className="mr-2">Delete Repository</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <NeonText as="h3" size="xl" color="violet" underline="gradient">Accent Elements</NeonText>
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-black/30 rounded cyber-clip">
                <NeonText as="p" font="body" size="base" weight="medium" color="violet">
                  Neon Purple - Accent Elements and Highlights
                </NeonText>
                <button className="mt-3 py-2 px-4 bg-transparent border border-neon-purple text-neon-purple hover:bg-neon-purple/10 rounded flex items-center">
                  <span className="mr-2">Repository Settings</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Text effects section */}
      <section>
        <div className="border-b border-gray-800 pb-2 mb-6">
          <NeonText as="h2" size="2xl" color="cyberBlue" underline="none">
            Text Effects
          </NeonText>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-6">
            <div>
              <NeonText as="h3" size="xl" color="blue" underline="gradient">
                Glitch Effects
              </NeonText>
              <div className="mt-4 space-y-4">
                <NeonText as="div" size="xl" font="display" color="cyberBlue" glitch="subtle">
                  Subtle Glitch Effect
                </NeonText>
                <NeonText as="div" size="xl" font="display" color="cyberTeal" glitch="medium">
                  Medium Glitch Effect
                </NeonText>
                <NeonText as="div" size="xl" font="display" color="cyberPink" glitch="strong">
                  Strong Glitch Effect
                </NeonText>
              </div>
            </div>
            
            <div>
              <NeonText as="h3" size="xl" color="blue" underline="gradient">
                Underline Styles
              </NeonText>
              <div className="mt-4 space-y-4">
                <NeonText as="div" size="lg" font="display" color="blue" underline="gradient">
                  Gradient Underline
                </NeonText>
                <NeonText as="div" size="lg" font="display" color="teal" underline="solid">
                  Solid Underline
                </NeonText>
                <NeonText as="div" size="lg" font="display" color="violet" underline="dashed">
                  Dashed Underline
                </NeonText>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-6">
            <div>
              <NeonText as="h3" size="xl" color="blue" underline="gradient">
                Flicker Effects
              </NeonText>
              <div className="mt-4 space-y-4">
                <NeonText as="div" size="xl" font="display" color="blue" flicker="subtle">
                  Subtle Flicker Effect
                </NeonText>
                <NeonText as="div" size="xl" font="display" color="teal" flicker="medium">
                  Medium Flicker Effect
                </NeonText>
                <NeonText as="div" size="xl" font="display" color="pink" flicker="strong">
                  Strong Flicker Effect
                </NeonText>
              </div>
            </div>
            
            <div>
              <NeonText as="h3" size="xl" color="blue" underline="gradient">
                Font Weights
              </NeonText>
              <div className="mt-4 space-y-4">
                <NeonText as="div" size="lg" font="body" weight="light" color="blueSubdued">
                  Light Weight (300)
                </NeonText>
                <NeonText as="div" size="lg" font="body" weight="normal" color="blueSubdued">
                  Normal Weight (400)
                </NeonText>
                <NeonText as="div" size="lg" font="body" weight="medium" color="blueSubdued">
                  Medium Weight (500)
                </NeonText>
                <NeonText as="div" size="lg" font="body" weight="bold" color="blueSubdued">
                  Bold Weight (700)
                </NeonText>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Usage Guidelines section */}
      <section>
        <div className="border-b border-gray-800 pb-2 mb-6">
          <NeonText as="h2" size="2xl" color="cyberTeal" underline="none">
            Usage Guidelines
          </NeonText>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <NeonText as="h3" size="xl" color="blue" underline="gradient">
              Do&apos;s
            </NeonText>
            <ul className="mt-4 space-y-2 list-disc list-inside text-teal-300">
              <li>Use Orbitron for impactful headers only</li>
              <li>Reserve intense neon colors for primary CTAs</li>
              <li>Use subdued variants for secondary information</li>
              <li>Maintain consistent font sizes within sections</li>
              <li>Apply flicker effects sparingly for emphasis</li>
            </ul>
          </div>
          
          <div>
            <NeonText as="h3" size="xl" color="pink" underline="gradient">
              Don&apos;ts
            </NeonText>
            <ul className="mt-4 space-y-2 list-disc list-inside text-pink-300">
              <li>Don&apos;t use intense neon colors for body text</li>
              <li>Avoid using Orbitron for paragraphs</li>
              <li>Don&apos;t overuse animation effects</li>
              <li>Avoid excessive font size variations</li>
              <li>Don&apos;t mix too many colors in a single section</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TypographyShowcase;