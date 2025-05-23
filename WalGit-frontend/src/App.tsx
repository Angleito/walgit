import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// This is a legacy component that redirects to the Next.js app
const App = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the Next.js app
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="mb-4">
          This application has been migrated to Next.js. You will be redirected automatically.
        </p>
        <p className="text-sm text-muted-foreground">
          If you are not redirected, <Link href="/" className="text-blue-600 hover:underline">click here</Link>.
        </p>
      </div>
    </div>
  );
};

export default App;
