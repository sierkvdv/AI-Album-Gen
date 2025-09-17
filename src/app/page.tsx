'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSignIn = () => {
    console.log('Login button clicked');
    console.log('Current URL:', window.location.href);
    
    // Try multiple approaches
    try {
      // Method 1: Direct redirect
      window.location.href = '/api/auth/signin/google';
    } catch (error) {
      console.error('Redirect failed:', error);
      // Method 2: Open in new tab
      window.open('/api/auth/signin/google', '_blank');
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

      <div className="space-y-4">
        <button
          onClick={handleSignIn}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
        >
          Sign in with Google
        </button>
        
        <div className="text-sm text-gray-500">
          <p>If the button doesn't work, try these direct links:</p>
          <div className="space-y-2">
            <a 
              href="/api/auth/signin/google"
              className="text-blue-600 hover:underline block"
            >
              Direct Google Login (Simple)
            </a>
            <a 
              href="/api/test-auth"
              className="text-green-600 hover:underline block"
            >
              Test Auth Status
            </a>
            <a 
              href="/api/debug-oauth"
              className="text-purple-600 hover:underline block"
            >
              Debug OAuth Config
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
