'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WalletAuthPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to home page since wallet connection is now in the header
    router.push('/');
  }, [router]);
  
  return (
    <div className="container max-w-4xl pt-8 pb-16">
      <p>Redirecting...</p>
    </div>
  );
}