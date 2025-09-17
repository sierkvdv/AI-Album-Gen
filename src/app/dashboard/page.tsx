"use client";

import { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
      const sess = await (await fetch('/api/user')).json();
      if (!sess?.user) {
        router.push('/');
        return;
      }
      setSession(sess);
      const res = await fetch('/api/user/generations');
      const data = await res.json();
      setGenerations(data.generations);
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
          <a
            href="/api/auth/signout"
            className="text-sm text-red-600 hover:underline"
          >
            Sign out
          </a>
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
                <img
                  src={gen.imageUrl}
                  alt={gen.prompt}
                  className="w-full h-auto rounded"
                />
                <div className="mt-2 text-sm">
                  <p className="font-medium">{gen.prompt}</p>
                  <p className="text-gray-500">{gen.style}</p>
                  <p className="text-gray-400">
                    {new Date(gen.createdAt).toLocaleString()}
                  </p>
                  <a
                    href={gen.imageUrl}
                    download
                    className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}