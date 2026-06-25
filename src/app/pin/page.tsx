'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldAlert } from 'lucide-react';

export default function PinPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  const CORRECT_PIN = process.env.NEXT_PUBLIC_APP_PIN;
  const MAX_ATTEMPTS = 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || attempts >= MAX_ATTEMPTS) return;

    if (!CORRECT_PIN || pin === CORRECT_PIN) {
      // Set cookie for 24 hours
      document.cookie = `app-access-pin=${pin}; path=/; max-age=86400; SameSite=Lax`;
      window.location.href = '/candidates';
    } else {
      const remaining = MAX_ATTEMPTS - attempts - 1;
      setAttempts(a => a + 1);
      setPin('');
      setError(remaining > 0 
        ? `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
        : 'Too many incorrect attempts. Please contact your administrator.'
      );
    }
  };

  const isLocked = attempts >= MAX_ATTEMPTS;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-text-primary p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex justify-center mb-8">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center border ${isLocked ? 'bg-red-500/20 border-red-500/30' : 'bg-accent/20 border-accent/30'}`}>
            {isLocked 
              ? <ShieldAlert className="w-8 h-8 text-red-400" />
              : <Lock className="w-8 h-8 text-accent" />
            }
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {isLocked ? 'Access Locked' : 'Company Access'}
          </h1>
          <p className="text-sm text-text-secondary">
            {isLocked 
              ? 'Too many failed attempts. Contact your administrator.'
              : 'Enter your team PIN to access the command center.'}
          </p>
        </div>

        {!isLocked && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="• • • • • •"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              className="input w-full text-center text-2xl tracking-[0.5em] py-4"
              autoFocus
              maxLength={12}
            />
            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}
            <button 
              type="submit" 
              disabled={!pin}
              className="btn btn-primary w-full py-3 text-sm font-semibold"
            >
              Unlock Dashboard
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

