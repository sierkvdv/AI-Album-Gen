"use client";

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { stylePresets } from '@/lib/stylePresets';
import { loadStripe } from '@stripe/stripe-js';

// Type for generation objects returned from the API
interface Generation {
  id: string;
  prompt: string;
  style: string;
  imageUrl: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [styleId, setStyleId] = useState(stylePresets[0]?.id ?? '');
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [creditsToBuy, setCreditsToBuy] = useState(5);

  // Fetch session and generations on mount
  useEffect(() => {
    async function fetchData() {
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
        
        setSession(sess);
        const res = await fetch('/api/user/generations');
        const data = await res.json();
        setGenerations(data.generations || []);
      } catch (error) {
        setError('Failed to load data. Please try refreshing the page.');
      }
    }
    fetchData();
  }, [router]);

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
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}
      </form>
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
        </div>
      )}
    </div>
  );
}