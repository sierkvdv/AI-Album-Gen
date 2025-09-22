"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut, getSession } from 'next-auth/react';
import { stylePresets } from '@/lib/stylePresets';
import { aspectRatios } from '@/lib/aspectRatios';
import { loadStripe } from '@stripe/stripe-js';

/**
 * Shape of a generation returned from the API.
 */
interface Generation {
  id: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  width: number;
  height: number;
  imageUrl: string;
  createdAt: string;
}

/**
 * Dashboard page. Displays the user's current credits, allows them to
 * generate new covers, purchase additional credits and browse their
 * generation history. Each generation can be downloaded, regenerated or
 * opened in the simple editor.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState('');
  const [styleId, setStyleId] = useState('none'); // Default to "No Style"
  const [aspectRatioId, setAspectRatioId] = useState(aspectRatios[0]?.id ?? '');
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [creditsToBuy, setCreditsToBuy] = useState(5);

  // Fetch user info and existing generations
  const fetchData = async () => {
    try {
      const sessRes = await fetch('/api/user');
      const sess = await sessRes.json();
      if (!sessRes.ok || !sess?.user) {
        // Only redirect if it's a 401 (unauthorized), not a 500 (server error)
        if (sessRes.status === 401) {
          router.push('/');
          return;
        }
        // For other errors, show error message but don't redirect
        setError('Unable to load user data. Please try refreshing the page.');
        return;
      }
      const gensRes = await fetch('/api/user/generations');
      const gens = await gensRes.json();
      setGenerations(gens.generations || []);
      console.log('Fetched generations:', gens.generations); // Debug log
    } catch (err) {
      setError('Failed to load data. Please try refreshing the page.');
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [router]);

  // Generate a new cover using the AI endpoint
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, styleId, aspectRatioId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }
      setSuccessMessage('Image generated successfully!');
      setPrompt('');
      // Refresh all data including generations and credits
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  }

  // Begin Stripe checkout for purchasing credits
  async function handleBuyCredits(e: React.FormEvent) {
    e.preventDefault();
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: creditsToBuy }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  }

  // Download a generation via the proxy API. Uses a temporary signed URL that
  // expires after a short period. Displays an alert if the URL is invalid.
  async function downloadGeneration(id: string) {
    try {
      const res = await fetch(`/api/image/${id}`);
      if (!res.ok) {
        throw new Error('Failed to get download URL');
      }
      const data = await res.json();
      const link = document.createElement('a');
      link.href = data.url;
      link.download = `album-cover-${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Download failed. The image may have expired. Please try regenerating it.');
    }
  }

  // Redirect to editor for a specific generation
  function editGeneration(id: string) {
    router.push(`/editor/${id}`);
  }

  // Sign out and redirect to home
  async function handleSignOut() {
    await signOut({ callbackUrl: '/' });
  }

  // Add credits function for testing
  const addCredits = async (amount: number) => {
    try {
      const res = await fetch('/api/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        // Refresh user data to show updated credits
        await fetchData();
        // Force refresh the session to update credits display
        const { getSession } = await import('next-auth/react');
        await getSession();
      } else {
        setError(data.error || 'Failed to add credits');
      }
    } catch (err) {
      setError('Failed to add credits');
    }
  };

  if (!session) {
    return (
      <div className="max-w-screen-lg mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Dashboard</h1>
        {session && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Credits: {(session.user as any)?.credits ?? 0}
            </span>
            <button
              onClick={() => addCredits(5)}
              className="px-3 py-1 text-sm bg-green-200 hover:bg-green-300 rounded mr-2"
            >
              +5 Credits (Test)
            </button>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {/* Generation Form */}
      <div className="mt-6 p-6 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Generate New Image</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
              Describe your image
            </label>
            <input
              type="text"
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A futuristic cityscape at sunset with neon lights"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700">
              Aspect Ratio
            </label>
            <select
              id="aspectRatio"
              value={aspectRatioId}
              onChange={(e) => setAspectRatioId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {aspectRatios.map((ratio) => (
                <option key={ratio.id} value={ratio.id}>
                  {ratio.name} ({ratio.ratio}) - {ratio.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="style" className="block text-sm font-medium text-gray-700">
              Style
            </label>
            <select
              id="style"
              value={styleId}
              onChange={(e) => setStyleId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {stylePresets.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.category === 'None' ? style.name : `${style.name} (${style.category})`} - {style.description}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
                disabled={loading || ((session.user as any)?.credits ?? 0) < 1}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Image (1 Credit)'}
          </button>
        </form>
      </div>

      {/* Purchase Credits */}
      <div className="mt-6 p-6 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Purchase Credits</h2>
        <form onSubmit={handleBuyCredits} className="space-y-4">
          <div>
            <label htmlFor="credits" className="block text-sm font-medium text-gray-700">
              Number of credits
            </label>
            <select
              id="credits"
              value={creditsToBuy}
              onChange={(e) => setCreditsToBuy(Number(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5 credits - $5.00</option>
              <option value={10}>10 credits - $10.00</option>
              <option value={25}>25 credits - $25.00</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={checkoutLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {checkoutLoading ? 'Processing...' : 'Buy Credits'}
          </button>
        </form>
      </div>

      {/* Generations History */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Your Generations</h2>
        {generations.length === 0 ? (
          <p className="text-gray-500">No generations yet. Create your first cover above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations.map((gen) => (
              <div key={gen.id} className="bg-white border rounded-lg p-4">
                <img
                  src={gen.imageUrl}
                  alt={gen.prompt}
                  className="w-full h-48 object-cover rounded mb-3"
                />
                <h3 className="font-medium text-sm mb-2 line-clamp-2">{gen.prompt}</h3>
                <p className="text-xs text-gray-500 mb-1">Style: {gen.style}</p>
                <p className="text-xs text-gray-500 mb-1">Size: {gen.width}x{gen.height} ({gen.aspectRatio})</p>
                <p className="text-xs text-gray-500 mb-3">
                  {new Date(gen.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadGeneration(gen.id)}
                    className="flex-1 bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => editGeneration(gen.id)}
                    className="flex-1 bg-gray-600 text-white text-xs py-1 px-2 rounded hover:bg-gray-700"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}