'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    
    try {
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: false 
      });
      
      if (result?.error) {
        setError(`Sign-in failed: ${result.error}`);
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Sign-in error:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="text-lg">Loading...</div>
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

      <button
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
      </button>

      {error && (
        <div className="text-red-600 text-sm text-center max-w-md">
          {error}
        </div>
      )}

      {/* Debug info */}
      <div className="text-xs text-gray-400 text-center">
        <p>Status: {status}</p>
        <p>Session: {session ? 'Yes' : 'No'}</p>
      </div>
    </main>
  );
}
