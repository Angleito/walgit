'use client';

import { LoadingSpinner } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner 
        size="lg" 
        variant="circuit" 
        color="blue"
        text="WalGit is decrypting..."
      />
    </div>
  );
}