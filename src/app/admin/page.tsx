"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  credits: number;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<string>('');

  useEffect(() => {
    async function load() {
      const sessRes = await fetch('/api/user');
      const sess = await sessRes.json();
      if (!sess?.user || !sess.user.isAdmin) {
        router.push('/');
        return;
      }
      setSession(sess);
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    }
    load();
  }, [router]);

  async function adjustCredits(userId: string, delta: number) {
    setAdjusting(userId);
    try {
      const res = await fetch(`/api/admin/user/${userId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: delta }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to adjust credits');
      } else {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, credits: data.user.credits } : u)));
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdjusting('');
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">Admin Panel</h1>
      {error && <p className="text-red-600">{error}</p>}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="border p-2">User</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Credits</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="p-2">
                {user.name ?? '—'}
                {user.isAdmin && <span className="ml-1 text-xs bg-gray-200 px-1 rounded">admin</span>}
              </td>
              <td className="p-2">{user.email ?? '—'}</td>
              <td className="p-2">{user.credits}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => adjustCredits(user.id, 1)}
                  disabled={adjusting === user.id}
                  className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                >
                  +1
                </button>
                <button
                  onClick={() => adjustCredits(user.id, -1)}
                  disabled={adjusting === user.id || user.credits <= 0}
                  className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                >
                  -1
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}