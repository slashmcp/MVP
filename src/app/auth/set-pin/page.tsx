'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page runs client-side after OAuth to pick up the PIN from sessionStorage
// and set it as a cookie before forwarding to the app.
export default function SetPinPage() {
  const router = useRouter();

  useEffect(() => {
    const pendingPin = sessionStorage.getItem('pending-pin');
    if (pendingPin) {
      // Set the PIN cookie for 24 hours
      document.cookie = `app-access-pin=${pendingPin}; path=/; max-age=86400; SameSite=Lax`;
      sessionStorage.removeItem('pending-pin');
    }
    // Forward to the app
    router.replace('/candidates');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-text-secondary">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Setting up your workspace…</p>
      </div>
    </div>
  );
}
