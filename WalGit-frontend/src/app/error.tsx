'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="text-center max-w-md px-4">
        <h2 className="text-2xl font-bold mb-4 text-[#ff2a6d]">Something went wrong!</h2>
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg text-left">
            <p className="text-sm text-gray-300 mb-2">Error details:</p>
            <pre className="text-xs text-red-400 overflow-x-auto">{error.message}</pre>
            {error.digest && (
              <p className="text-xs text-gray-400 mt-2">Digest: {error.digest}</p>
            )}
          </div>
        )}
        <button 
          onClick={reset} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}