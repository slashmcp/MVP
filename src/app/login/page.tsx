'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Lock, Network, RefreshCw, ArrowRight, ShieldAlert } from 'lucide-react';

const CORRECT_PIN = process.env.NEXT_PUBLIC_APP_PIN;

export default function LoginPage() {
  const [step, setStep] = useState<'pin' | 'oauth'>('pin');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingMicrosoft, setIsLoadingMicrosoft] = useState(false);
  const supabase = createClient();

  const MAX_ATTEMPTS = 5;
  const isLocked = attempts >= MAX_ATTEMPTS;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || isLocked) return;

    if (!CORRECT_PIN || pin === CORRECT_PIN) {
      // Store verified PIN in sessionStorage — auth/callback will pick it up and set the cookie
      sessionStorage.setItem('pending-pin', pin);
      setStep('oauth');
    } else {
      const remaining = MAX_ATTEMPTS - attempts - 1;
      setAttempts(a => a + 1);
      setPin('');
      setPinError(
        remaining > 0
          ? `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Too many incorrect attempts.'
      );
    }
  };

  const handleLogin = async (provider: 'google' | 'azure') => {
    try {
      if (provider === 'google') setIsLoadingGoogle(true);
      else setIsLoadingMicrosoft(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes:
            provider === 'google'
              ? 'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file'
              : 'openid email profile Mail.Send Mail.ReadWrite Calendars.ReadWrite User.Read',
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error) console.error(error.message);
    } catch (err: any) {
      console.error(err.message);
      setIsLoadingGoogle(false);
      setIsLoadingMicrosoft(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center border transition-colors ${
            isLocked
              ? 'bg-red-500/20 border-red-500/30'
              : step === 'oauth'
              ? 'bg-green-500/20 border-green-500/30'
              : 'bg-accent/20 border-accent/30'
          }`}>
            {isLocked
              ? <ShieldAlert className="w-8 h-8 text-red-400" />
              : step === 'oauth'
              ? <Network className="w-8 h-8 text-green-400" />
              : <Lock className="w-8 h-8 text-accent" />
            }
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {step === 'pin' ? 'Company PIN' : 'Sign In'}
          </h1>
          <p className="text-sm text-text-secondary">
            {step === 'pin'
              ? 'Enter your team PIN to access the workspace.'
              : 'PIN verified ✓ — choose how to sign in.'}
          </p>
        </div>

        {/* Step 1: PIN */}
        {step === 'pin' && !isLocked && (
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input
              type="password"
              placeholder="• • • • • •"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(''); }}
              className="input w-full text-center text-2xl tracking-[0.5em] py-4"
              autoFocus
              maxLength={12}
            />
            {pinError && <p className="text-xs text-red-400 text-center">{pinError}</p>}
            <button
              type="submit"
              disabled={!pin}
              className="btn btn-primary w-full py-3 font-semibold flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="w-full text-xs text-text-tertiary hover:text-text-secondary transition-colors py-2"
            >
              ← Back to demo
            </button>
          </form>
        )}

        {isLocked && (
          <p className="text-center text-sm text-red-400 mt-4">
            Too many failed attempts. Contact your administrator.
          </p>
        )}

        {/* Step 2: OAuth */}
        {step === 'oauth' && (
          <div className="space-y-3">
            <button
              onClick={() => handleLogin('google')}
              disabled={isLoadingGoogle || isLoadingMicrosoft}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[var(--surface-elevated)] border border-border rounded-xl text-text-primary font-medium hover:bg-surface hover:border-accent/50 transition-all disabled:opacity-50"
            >
              {isLoadingGoogle ? (
                <RefreshCw className="w-5 h-5 animate-spin text-text-secondary" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Sign in with Google
            </button>

            <button
              onClick={() => handleLogin('azure')}
              disabled={isLoadingGoogle || isLoadingMicrosoft}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[var(--surface-elevated)] border border-border rounded-xl text-text-primary font-medium hover:bg-surface hover:border-accent/50 transition-all disabled:opacity-50"
            >
              {isLoadingMicrosoft ? (
                <RefreshCw className="w-5 h-5 animate-spin text-text-secondary" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
              )}
              Sign in with Microsoft
            </button>

            <button
              onClick={() => { setStep('pin'); setPin(''); }}
              className="w-full text-xs text-text-tertiary hover:text-text-secondary transition-colors py-2"
            >
              ← Change PIN
            </button>
          </div>
        )}

        <p className="text-center text-xs text-text-tertiary mt-8">
          By signing in, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}
