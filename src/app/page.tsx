/* eslint-disable react/react-in-jsx-scope */
"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

  useEffect(() => {
    if (session) {
      // User is already signed in; redirect to dashboard.
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleSignIn = async () => {
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  // While the session is loading we can show a minimal spinner/message.
  if (status === "loading") {
    return (
      <main className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  // If the user is authenticated, avoid showing the sign‑in UI.
  if (session) {
    return (
      <main className="flex h-screen items-center justify-center">
        <p>Redirecting to dashboard...</p>
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
