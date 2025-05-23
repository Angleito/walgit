'use client';

import { Suspense } from 'react';
import { ReadmeViewer } from '@/components/repository/ReadmeViewer';
import { LanguageStats } from '@/components/repository/LanguageStats';
import { ContributorAvatars } from '@/components/repository/ContributorAvatars';
import { MultilevelBreadcrumb } from '@/components/repository/MultilevelBreadcrumb';
import { InteractiveRepositorySection } from './InteractiveSection';
import { CodeViewSection } from './CodeViewSection';
import {
  mockReadmeContent,
  languages,
  contributorsForAvatars,
} from './mockData';

export default function Phase1DemoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold gh-text-primary mb-8">
        Phase 1: GitHub-like UI Components Demo
      </h1>

      <div className="space-y-8">
        {/* Interactive Repository Actions - Client Component */}
        <section>
          <h2 className="text-2xl font-semibold gh-text-primary mb-4">Repository Actions</h2>
          <Suspense fallback={<div className="animate-pulse h-10 bg-gray-200 rounded" />}>
            <InteractiveRepositorySection />
          </Suspense>
        </section>

        {/* Static Language Statistics - Server Rendered */}
        <section>
          <h2 className="text-2xl font-semibold gh-text-primary mb-4">Language Statistics</h2>
          <LanguageStats languages={languages} />
        </section>

        {/* Static Contributor Avatars - Server Rendered */}
        <section>
          <h2 className="text-2xl font-semibold gh-text-primary mb-4">Contributor Avatars</h2>
          <ContributorAvatars
            contributors={contributorsForAvatars}
            maxDisplay={5}
          />
        </section>

        {/* Static README Viewer - Server Rendered */}
        <section>
          <h2 className="text-2xl font-semibold gh-text-primary mb-4">README Viewer</h2>
          <ReadmeViewer content={mockReadmeContent} />
        </section>

        {/* Code Views with Tabs - Client Component */}
        <section>
          <h2 className="text-2xl font-semibold gh-text-primary mb-4">Enhanced Code View</h2>
          <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded" />}>
            <CodeViewSection />
          </Suspense>
        </section>

        {/* Static Multi-level Breadcrumb - Server Rendered */}
        <section>
          <h2 className="text-2xl font-semibold gh-text-primary mb-4">Multi-level Breadcrumb</h2>
          <div className="gh-bg-canvas-subtle p-4 rounded-md">
            <MultilevelBreadcrumb
              repositoryPath="/repositories/walgit/core"
              branch="main"
              path="contracts/modules/repository/implementation/repository.move"
            />
          </div>
        </section>
      </div>
    </div>
  );
}