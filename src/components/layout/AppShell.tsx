'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../ui/ToastContainer';
import { CredentialPrompt } from '../ui/CredentialPrompt';
import { useAppStore } from '@/store/app-store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div
        className={`transition-all duration-200 
          ml-0 
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}
        `}
      >
        <Header />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
      <ToastContainer />
      <CredentialPrompt />
    </div>
  );
}
