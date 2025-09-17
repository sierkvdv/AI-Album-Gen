'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center p-8 space-y-6">
      <h1 className="text-4xl font-bold text-center">AI Album Cover Generator</h1>
      <p className="max-w-xl text-center text-gray-600">
        Generate unique album covers with the power of AI. Sign in to use your free credits,
        enter a prompt and choose a style preset.
      </p>

      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        className="px-5 py-3 rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Sign in with Google
      </button>

      {/* Fallback naar de ingebouwde NextAuth sign-in pagina */}
      <div className="text-sm">
        <Link href="/api/auth/signin" className="underline">Open sign-in page</Link>
      </div>
    </main>
  );
}
