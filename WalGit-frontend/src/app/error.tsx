'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-[#ff2a6d]">Something went wrong!</h2>
        <button onClick={reset} className="text-white">Try again</button>
      </div>
    </div>
  );
}