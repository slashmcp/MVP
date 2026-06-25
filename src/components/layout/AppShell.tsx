'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Header } from './Header';
import { ToastContainer } from '../ui/ToastContainer';
import { CredentialPrompt } from '../ui/CredentialPrompt';
import { useAppStore } from '@/store/app-store';
import { AgentWidget } from '../ui/AgentWidget';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { fetchDatabase } = useAppStore();
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user state
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    // Fetch real DB data
    fetchDatabase();

    // Hold splash screen for 1.8 seconds, then fade out
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => setShowSplash(false), 500);
    }, 1800);

    return () => {
      clearTimeout(timer);
      authListener.subscription.unsubscribe();
    };
  }, [fetchDatabase]);

  return (
    <>
      {showSplash && (
        <div 
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--background)] transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="relative animate-pulse flex flex-col items-center">
            {/* Ambient glow behind logo */}
            <div className="absolute inset-0 w-full h-full bg-accent/20 blur-[80px] rounded-full scale-150 pointer-events-none" />
            
            <Image 
              src="/logo.png" 
              alt="Ion Recruitment" 
              width={180} 
              height={180} 
              className="relative z-10 object-contain drop-shadow-2xl opacity-90 dark:invert-0 invert" 
              priority
            />
            <h1 className="relative z-10 mt-8 text-2xl tracking-[0.4em] uppercase font-light text-text-primary">
              Ion <span className="font-bold text-accent">Recruitment</span>
            </h1>
            <div className="mt-8 relative z-10 w-48 h-1 bg-[var(--surface-overlay)] overflow-hidden rounded-full">
              <div className="w-full h-full bg-accent animate-progress-bar rounded-full" />
            </div>
          </div>
        </div>
      )}

      <div className={`min-h-screen bg-[var(--background)] relative overflow-hidden transition-opacity duration-500 ${showSplash ? 'opacity-0 h-screen overflow-hidden' : 'opacity-100'}`}>
        {/* Ambient background glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />
        
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="p-4 lg:p-8 w-full flex-grow relative z-10">{children}</main>
        </div>
        <ToastContainer />
        <CredentialPrompt />
        {/* Eve only available when signed in */}
        {user && <AgentWidget />}
      </div>
    </>
  );
}
