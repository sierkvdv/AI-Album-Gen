import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  return (
    <main className="flex flex-col items-center justify-center p-8 space-y-6">
      <h1 className="text-4xl font-bold text-center">AI Album Cover Generator</h1>
      <p className="text-center max-w-prose">
        Generate unique album covers with the power of artificial intelligence. Sign in to start
        using your free credits, enter a prompt and choose a style preset to get started.
      </p>
      {session ? (
        <>
          <p>Welcome back, {session.user?.name ?? session.user?.email}!</p>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </>
      ) : (
        <div className="flex space-x-4">
          <Link
            href="/api/auth/signin"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign in / Sign up
          </Link>
        </div>
      )}
    </main>
  );
}