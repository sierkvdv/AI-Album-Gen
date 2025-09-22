"use client";

import { useEffect, useState } from 'react';
<<<<<<< HEAD
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { stylePresets } from '@/lib/stylePresets';
import { loadStripe } from '@stripe/stripe-js';

/**
 * Shape of a generation returned from the API.
 */
=======
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { stylePresets } from '@/lib/stylePresets';
import { loadStripe } from '@stripe/stripe-js';

// Type for generation objects returned from the API
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
interface Generation {
  id: string;
  prompt: string;
  style: string;
  imageUrl: string;
  createdAt: string;
}

<<<<<<< HEAD
/**
 * Dashboard page. Displays the user's current credits, allows them to
 * generate new covers, purchase additional credits and browse their
 * generation history. Each generation can be downloaded, regenerated or
 * opened in the simple editor.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
=======
export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
  const [prompt, setPrompt] = useState('');
  const [styleId, setStyleId] = useState(stylePresets[0]?.id ?? '');
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
<<<<<<< HEAD
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [creditsToBuy, setCreditsToBuy] = useState(5);

  // Fetch user info and existing generations on mount
=======

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [creditsToBuy, setCreditsToBuy] = useState(5);

  // Fetch session and generations on mount
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
  useEffect(() => {
    async function fetchData() {
      try {
        const sessRes = await fetch('/api/user');
        const sess = await sessRes.json();
<<<<<<< HEAD
        if (!sessRes.ok || !sess?.user) {
=======
        
        if (!sessRes.ok || !sess?.user) {
          // Only redirect if it's a 401 (unauthorized), not a 500 (server error)
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
          if (sessRes.status === 401) {
            router.push('/');
            return;
          }
<<<<<<< HEAD
          setError('Unable to load user data. Please try refreshing the page.');
          return;
        }
        const gensRes = await fetch('/api/user/generations');
        const gens = await gensRes.json();
        setGenerations(gens.generations || []);
      } catch (err) {
=======
          // For other errors, show error message but don't redirect
          setError('Unable to load user data. Please try refreshing the page.');
          return;
        }
        
        setSession(sess);
        const res = await fetch('/api/user/generations');
        const data = await res.json();
        setGenerations(data.generations || []);
      } catch (error) {
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
        setError('Failed to load data. Please try refreshing the page.');
      }
    }
    fetchData();
  }, [router]);

<<<<<<< HEAD
  // Generate a new cover using the AI endpoint
=======
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, styleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }
      setGenerations((prev) => [data.generation, ...prev]);
      setSuccessMessage('Image generated successfully!');
      setPrompt('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

<<<<<<< HEAD
  // Begin Stripe checkout for purchasing credits
=======
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
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
        throw new Error(data.error || 'Unable to start checkout');
      }
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');
      if (!stripe) throw new Error('Stripe not loaded');
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  }

<<<<<<< HEAD
  // Download a generation via the proxy API. Uses a temporary signed URL that
  // expires after a short period. Displays an alert if the URL is invalid.
  async function downloadGeneration(id: string) {
    try {
      const response = await fetch(`/api/image/${id}`);
      if (!response.ok) {
        throw new Error('Image expired or unavailable');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `album-cover-${id}.png`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('This image is no longer available for download. The URL has expired. Use the Regenerate button to get a fresh image.');
    }
  }

  // Regenerate an image, consuming a credit. On success refresh the list.
  async function regenerate(id: string) {
    if (!confirm('Regenerate this image? This will use 1 credit and create a new image URL.')) return;
    try {
      const response = await fetch('/api/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: id }),
      });
      if (response.ok) {
        alert('Image regenerated successfully! Refreshing…');
        // Re-fetch generations
        const gensRes = await fetch('/api/user/generations');
        const gens = await gensRes.json();
        setGenerations(gens.generations || []);
      } else {
        const error = await response.json();
        alert(`Failed to regenerate: ${error.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to regenerate image. Please try again.');
    }
  }

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Dashboard</h1>
        {session && (
          <div className="flex items-center space-x-4">
            <span>Credits: {(session.user as any)?.credits}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-red-600 hover:underline"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
      {/* Purchase credits */}
      <form onSubmit={handleBuyCredits} className="mt-4 space-y-2 border p-4 rounded">
        <h2 className="font-medium">Buy Credits</h2>
        <input
          type="number"
          min={1}
          value={creditsToBuy}
          onChange={(e) => setCreditsToBuy(parseInt(e.target.value, 10))}
          className="w-full border rounded p-2"
        />
        <button
          type="submit"
          disabled={checkoutLoading}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          {checkoutLoading ? 'Processing…' : 'Buy'}
        </button>
      </form>
      {/* Generate new cover */}
      <form onSubmit={handleGenerate} className="mt-4 space-y-2 border p-4 rounded">
        <h2 className="font-medium">Generate Album Cover</h2>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full border rounded p-2"
          placeholder="Describe your album cover…"
          required
        />
        <select
          value={styleId}
          onChange={(e) => setStyleId(e.target.value)}
          className="w-full border rounded p-2"
        >
          {stylePresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1 bg-green-600 text-white rounded"
        >
          {loading ? 'Generating…' : 'Generate'}
=======
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      {session && (
        <div className="flex items-center justify-between">
          <p>
            <strong>Credits:</strong> {(session.user as any)?.credits}
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-red-600 hover:underline"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Purchase credits */}
      <form onSubmit={handleBuyCredits} className="flex items-end space-x-2 bg-white p-4 rounded shadow">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1" htmlFor="credits">
            Buy Credits
          </label>
          <input
            type="number"
            id="credits"
            min={1}
            value={creditsToBuy}
            onChange={(e) => setCreditsToBuy(parseInt(e.target.value, 10))}
            className="w-full border rounded p-2"
          />
        </div>
        <button
          type="submit"
          disabled={checkoutLoading}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {checkoutLoading ? 'Processing...' : 'Buy'}
        </button>
      </form>
      <form onSubmit={handleGenerate} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="prompt">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Describe your album cover..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="style">
            Style preset
          </label>
          <select
            id="style"
            value={styleId}
            onChange={(e) => setStyleId(e.target.value)}
            className="w-full border rounded p-2"
          >
            {stylePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}
      </form>
<<<<<<< HEAD
      {/* Generation history */}
      {generations.length > 0 && (
        <div className="mt-6">
          <h2 className="font-medium mb-2">Your Generations</h2>
          <ul className="space-y-4">
            {generations.map((gen) => (
              <li key={gen.id} className="border p-4 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{gen.prompt}</h3>
                    <p className="text-sm text-gray-600">Style: {gen.style}</p>
                    <p className="text-xs text-gray-500">{new Date(gen.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <button
                      onClick={() => downloadGeneration(gen.id)}
                      className="px-2 py-1 bg-blue-600 text-white text-sm rounded"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => regenerate(gen.id)}
                      className="px-2 py-1 bg-yellow-600 text-white text-sm rounded"
                    >
                      Regenerate
                    </button>
                    <Link
                      href={`/editor/${gen.id}`}
                      className="px-2 py-1 bg-purple-600 text-white text-sm rounded text-center"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
=======
      {generations.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Generations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {generations.map((gen) => (
              <div key={gen.id} className="bg-white p-2 rounded shadow">
                <div className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                  <img
                    src={`/api/image/${gen.id}`}
                    alt={gen.prompt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-2 text-sm">
                  <p className="font-medium">{gen.prompt}</p>
                  <p className="text-gray-500">{gen.style}</p>
                  <p className="text-gray-400">
                    {new Date(gen.createdAt).toLocaleString()}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <a
                      href={`/api/image/${gen.id}`}
                      download={`album-cover-${gen.id}.png`}
                      className="text-blue-600 hover:underline text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        // Try to download via proxy, show alert if expired
                        fetch(`/api/image/${gen.id}`)
                          .then(response => {
                            if (response.ok) {
                              return response.blob();
                            } else {
                              throw new Error('Image expired or unavailable');
                            }
                          })
                          .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `album-cover-${gen.id}.png`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                          })
                          .catch(error => {
                            alert('This image is no longer available for download. The URL has expired. Use the Regenerate button to get a fresh image.');
                          });
                      }}
                    >
                      Download
                    </a>
                    <button
                      className="text-green-600 hover:underline text-xs"
                      onClick={async () => {
                        if (confirm('Regenerate this image? This will use 1 credit and create a new image URL.')) {
                          try {
                            const response = await fetch('/api/regenerate-image', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ generationId: gen.id })
                            });
                            
                            if (response.ok) {
                              alert('Image regenerated successfully! Refresh the page to see the new image.');
                              window.location.reload();
                            } else {
                              const error = await response.json();
                              alert(`Failed to regenerate: ${error.message || 'Unknown error'}`);
                            }
                          } catch (error) {
                            alert('Failed to regenerate image. Please try again.');
                          }
                        }
                      }}
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
        </div>
      )}
    </div>
  );
}