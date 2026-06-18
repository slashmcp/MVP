'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store/app-store';
import {
  Search,
  Home,
  Sun,
  Moon,
  Bell,
  Menu,
  Database,
  Sparkles,
  Mail,
  Workflow,
  ChevronRight,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useRef, useMemo } from 'react';
// No mock data needed

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { globalSearch, setGlobalSearch, setSidebarMobileOpen, showCredentialPrompt, dbCandidates, dbJobs, dbClients } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        // We could clear search here, but letting it stay is fine
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!globalSearch || globalSearch.length < 2) return null;
    const q = globalSearch.toLowerCase();
    const cands = dbCandidates || [];
    const jobs = dbJobs || [];
    const clients = dbClients || [];
    return {
      candidates: cands.filter(c => c.name.toLowerCase().includes(q) || c.skills?.some((s: string) => s.toLowerCase().includes(q))),
      jobs: jobs.filter(j => j.title.toLowerCase().includes(q) || j.client.toLowerCase().includes(q)),
      clients: clients.filter(c => c.companyName.toLowerCase().includes(q)),
    };
  }, [globalSearch, dbCandidates, dbJobs, dbClients]);

  return (
    <header className="h-14 border-b border-border bg-[var(--surface-overlay)] backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between px-4 lg:px-6 relative">
      {/* Mobile full-width search overlay */}
      {showMobileSearch && (
        <div className="absolute inset-0 bg-surface z-30 flex items-center px-4 gap-2 border-b border-border animate-fade-in sm:hidden">
          <Search className="w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            autoFocus
            placeholder="Search candidates, jobs..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary"
          />
          <button 
            onClick={() => {
              setShowMobileSearch(false);
              setGlobalSearch('');
            }}
            className="p-2 text-text-secondary hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Left: hamburger + search + home */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="p-2 -ml-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
        </button>

        {mounted && pathname !== '/' && (
          <Link href="/" className="p-2 -ml-1 rounded-md text-text-secondary hover:text-accent hover:bg-accent-soft transition-all hidden sm:flex items-center justify-center">
            <Home className="w-4 h-4" strokeWidth={1.75} />
          </Link>
        )}

        <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
          {/* Global Search Bar Removed - AI Sourcing Engine is now the primary search */}
        </div>

        <button
          className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all sm:hidden"
          onClick={() => setShowMobileSearch(true)}
        >
          <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex items-center gap-1 ml-2">
        {/* Notifications and onboarding tasks removed for MVP */}

        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all duration-150"
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.75} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.75} />}
          </button>
        )}

        <Link href="/" className="w-10 h-10 rounded-full bg-accent/5 border border-accent/20 flex items-center justify-center ml-1 cursor-pointer hover:bg-accent/10 transition-colors overflow-hidden">
          <Image src="/logo.png" alt="Ion Recruitment" width={36} height={36} className="object-cover scale-150 dark:invert-0 invert opacity-100" />
        </Link>
      </div>

      {/* Mobile Search Results */}
      {showMobileSearch && searchResults && (
        <div className="absolute top-14 left-0 right-0 bg-surface border-b border-border shadow-xl z-40 max-h-[calc(100vh-3.5rem)] overflow-y-auto sm:hidden animate-fade-in">
          {searchResults.candidates.length > 0 && (
            <div className="py-2">
              <div className="px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Candidates</div>
              {searchResults.candidates.slice(0, 3).map(c => (
                <Link key={c.id} href={`/candidates/${c.id}`} onClick={() => { setShowMobileSearch(false); setGlobalSearch(''); }} className="block px-4 py-2 hover:bg-[var(--surface-elevated)] transition-colors">
                  <div className="text-sm font-medium text-text-primary">{c.name}</div>
                  <div className="text-xs text-text-secondary">{c.status} • {c.seniority}</div>
                </Link>
              ))}
            </div>
          )}
          {searchResults.jobs.length > 0 && (
            <div className="py-2 border-t border-border">
              <div className="px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Jobs</div>
              {searchResults.jobs.slice(0, 3).map(j => (
                <Link key={j.id} href={`/jobs/${j.id}`} onClick={() => { setShowMobileSearch(false); setGlobalSearch(''); }} className="block px-4 py-2 hover:bg-[var(--surface-elevated)] transition-colors">
                  <div className="text-sm font-medium text-text-primary">{j.title}</div>
                  <div className="text-xs text-text-secondary">{j.client} • {j.status}</div>
                </Link>
              ))}
            </div>
          )}
          {searchResults.clients.length > 0 && (
            <div className="py-2 border-t border-border">
              <div className="px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Clients</div>
              {searchResults.clients.slice(0, 3).map(cl => (
                <Link key={cl.id} href={`/clients/${cl.id}`} onClick={() => { setShowMobileSearch(false); setGlobalSearch(''); }} className="block px-4 py-2 hover:bg-[var(--surface-elevated)] transition-colors">
                  <div className="text-sm font-medium text-text-primary">{cl.companyName}</div>
                  <div className="text-xs text-text-secondary">{cl.openRoles} open roles</div>
                </Link>
              ))}
            </div>
          )}
          {searchResults.candidates.length === 0 && searchResults.jobs.length === 0 && searchResults.clients.length === 0 && (
            <div className="px-4 py-4 text-sm text-text-tertiary">No results found for "{globalSearch}"</div>
          )}
        </div>
      )}
      </div>
    </header>
  );
}
