'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('Session status changed:', { status, session: !!session });
    if (session) {
      console.log('Session found, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSignIn = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('Login button clicked');
    
    try {
      // Simple, direct redirect - most reliable method
      window.location.href = '/api/auth/signin/google?callbackUrl=/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="text-lg">Loading session...</div>
        <div className="text-sm text-gray-500">Status: {status}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Refresh Page
        </button>
      </main>
    );
  }

  if (session) {
    return (
      <main className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="text-lg">Redirecting to dashboard...</div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center p-8 space-y-6">
      <h1 className="text-4xl font-bold text-center">AI Album Cover Generator</h1>
      <p className="max-w-xl text-center text-gray-600">
        Generate unique album covers with the power of AI. Sign in to use your free credits,
        enter a prompt and choose a style preset.
      </p>

      <div className="space-y-4">
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="px-8 py-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium text-lg"
        >
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        
        <div className="text-sm text-gray-500 space-y-2">
          <p>If the button doesn't work, try this direct link:</p>
          <a 
            href="/api/auth/signin/google?callbackUrl=/dashboard"
            className="text-blue-600 hover:underline block"
          >
            Direct Google Login Link
          </a>
        </div>
      </div>
    </main>
  );
}
