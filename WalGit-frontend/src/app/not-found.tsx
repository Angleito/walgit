import Link from 'next/link';

export const runtime = 'edge';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#ff2a6d] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
        <Link href="/" className="text-[#05d9e8]">Go Home</Link>
      </div>
    </div>
  );
}