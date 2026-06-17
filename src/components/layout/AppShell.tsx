'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../ui/ToastContainer';
import { CredentialPrompt } from '../ui/CredentialPrompt';
import { useAppStore } from '@/store/app-store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />
      
      <Sidebar />
      <div
        className={`transition-all duration-200 
          ml-0 relative z-10
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}
        `}
      >
        <Header />
        <main className="p-4 lg:p-6 max-w-7xl mx-auto w-full">{children}</main>
      </div>
      <ToastContainer />
      <CredentialPrompt />
    </div>
  );
}
