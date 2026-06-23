'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PinPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    
    // Set cookie
    document.cookie = `app-access-pin=${pin}; path=/; max-age=86400; SameSite=Lax`;
    
    // Trigger router refresh to apply middleware again
    router.refresh();
    setTimeout(() => {
      router.push('/');
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-text-primary p-4">
      <div className="card p-8 max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Private Beta</h1>
          <p className="text-sm text-text-secondary mt-2">
            Please enter your PIN to access the production MVP dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="input w-full text-center text-xl tracking-widest py-3"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          <button type="submit" className="btn btn-primary w-full py-2.5">
            Unlock Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
