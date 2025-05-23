import { Metadata } from 'next';
import { RepositoryDiscovery } from '@/components/repository/RepositoryDiscovery';

export const metadata: Metadata = {
  title: 'Discover Repositories | WalGit',
  description: 'Discover and clone WalGit repositories with SEAL encryption and Walrus storage'
};

export default function DiscoverPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <RepositoryDiscovery />
    </div>
  );
}