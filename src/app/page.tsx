/* eslint-disable react/react-in-jsx-scope */
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Landing page for unauthenticated users.
 *
 * This page shows a simple introduction and a single "Sign in with Google"
 * button. When the user is already authenticated they are redirected to
 * the dashboard automatically. The sign‑in button invokes the `signIn`
 * helper from `next-auth/react` which triggers the Google OAuth flow with
 * a callback back to the dashboard.
 */
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (session) {
      // User is already signed in; redirect to dashboard after a delay
      // so they can see their account info
      const countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            router.push("/dashboard");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(countdownTimer);
    }
  }, [session, router]);

  const handleSignIn = async () => {
    // Use NextAuth signIn which will now force account selection
    await signIn("google", { callbackUrl: "/" });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // While the session is loading we can show a minimal spinner/message.
  if (status === "loading") {
    return (
      <main className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  // If the user is authenticated, show account info and logout option.
  if (session) {
    return (
      <main className="flex flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <div className="text-center">
          <p className="text-lg">Signed in as:</p>
          <p className="font-semibold text-blue-600">{session.user?.email}</p>
          <p className="text-sm text-gray-600">{session.user?.name}</p>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 focus:outline-none"
          >
            Go to Dashboard
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded bg-gray-600 px-4 py-2 font-semibold text-white hover:bg-gray-700 focus:outline-none"
          >
            Sign Out
          </button>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Want to use a different account?
          </p>
          <button
            type="button"
            onClick={handleSignIn}
            className="text-sm text-blue-600 hover:underline"
          >
            Switch to different Google account
          </button>
          <p className="text-xs text-gray-400 mt-1">
            This will log you out and show the account selector
          </p>
          <button
            type="button"
            onClick={() => {
              // Alternative method: direct Google logout then sign in
              window.open('https://accounts.google.com/logout', '_blank');
              setTimeout(() => {
                signIn("google", { callbackUrl: "/" });
              }, 1000);
            }}
            className="text-xs text-orange-600 hover:underline mt-1 block"
          >
            Alternative: Force Google logout first
          </button>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Redirecting to dashboard in {countdown} seconds...
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-sm text-green-600 hover:underline"
          >
            Go to dashboard now
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">AI Album Cover Generator</h1>
      <p className="max-w-md text-center">
        Generate unique album covers with the power of AI. Sign in to use your
        free credits, enter a prompt and choose a style preset.
      </p>
      <button
        type="button"
        onClick={handleSignIn}
        className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 focus:outline-none"
      >
        Sign in with Google
      </button>
    </main>
  );
}
