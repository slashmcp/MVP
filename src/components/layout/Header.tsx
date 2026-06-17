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
import { mockCandidates, mockJobs, mockClients } from '@/lib/mock-data';

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { globalSearch, setGlobalSearch, setSidebarMobileOpen, showCredentialPrompt } = useAppStore();
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

  const onboardingTasks = [
    { id: 'google-sheets', title: 'Connect Google Sheets', desc: 'Required for database sync', icon: Database, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'openai', title: 'Connect OpenAI', desc: 'Required for AI insights', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'outlook', title: 'Connect Outlook', desc: 'Required for email outreach', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'n8n', title: 'Connect n8n', desc: 'Required for automations', icon: Workflow, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'apollo', title: 'Connect Apollo', desc: 'Required for sourcing leads', icon: Search, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { id: 'apify', title: 'Connect Apify', desc: 'Required for LinkedIn scraping', icon: Database, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  const searchResults = useMemo(() => {
    if (!globalSearch || globalSearch.length < 2) return null;
    const q = globalSearch.toLowerCase();
    return {
      candidates: mockCandidates.filter(c => c.name.toLowerCase().includes(q) || c.skills.some(s => s.toLowerCase().includes(q))),
      jobs: mockJobs.filter(j => j.title.toLowerCase().includes(q) || j.client.toLowerCase().includes(q)),
      clients: mockClients.filter(c => c.companyName.toLowerCase().includes(q)),
    };
  }, [globalSearch]);

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

        <div className="relative flex-1 max-w-md hidden sm:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Search candidates, jobs, clients..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="input pl-10 py-1.5 bg-[var(--surface-elevated)] border-transparent focus:border-accent text-sm w-full"
          />
          
          {/* Desktop Search Results Dropdown */}
          {searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-[400px] overflow-y-auto animate-fade-in">
              {searchResults.candidates.length > 0 && (
                <div className="py-2">
                  <div className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Candidates</div>
                  {searchResults.candidates.slice(0, 3).map(c => (
                    <Link key={c.id} href={`/candidates/${c.id}`} onClick={() => setGlobalSearch('')} className="block px-4 py-2 hover:bg-[var(--surface-elevated)] transition-colors">
                      <div className="text-sm font-medium text-text-primary">{c.name}</div>
                      <div className="text-xs text-text-secondary">{c.status} • {c.seniority}</div>
                    </Link>
                  ))}
                </div>
              )}
              {searchResults.jobs.length > 0 && (
                <div className="py-2 border-t border-border">
                  <div className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Jobs</div>
                  {searchResults.jobs.slice(0, 3).map(j => (
                    <Link key={j.id} href={`/jobs/${j.id}`} onClick={() => setGlobalSearch('')} className="block px-4 py-2 hover:bg-[var(--surface-elevated)] transition-colors">
                      <div className="text-sm font-medium text-text-primary">{j.title}</div>
                      <div className="text-xs text-text-secondary">{j.client} • {j.status}</div>
                    </Link>
                  ))}
                </div>
              )}
              {searchResults.clients.length > 0 && (
                <div className="py-2 border-t border-border">
                  <div className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Clients</div>
                  {searchResults.clients.slice(0, 3).map(cl => (
                    <Link key={cl.id} href={`/clients/${cl.id}`} onClick={() => setGlobalSearch('')} className="block px-4 py-2 hover:bg-[var(--surface-elevated)] transition-colors">
                      <div className="text-sm font-medium text-text-primary">{cl.companyName}</div>
                      <div className="text-xs text-text-secondary">{cl.openRoles} open roles</div>
                    </Link>
                  ))}
                </div>
              )}
              {searchResults.candidates.length === 0 && searchResults.jobs.length === 0 && searchResults.clients.length === 0 && (
                <div className="px-4 py-3 text-sm text-text-tertiary">No results found for "{globalSearch}"</div>
              )}
            </div>
          )}
        </div>

        <button
          className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all sm:hidden"
          onClick={() => setShowMobileSearch(true)}
        >
          <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex items-center gap-1 ml-2">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-md transition-all duration-150 ${showNotifications ? 'bg-[var(--surface-elevated)] text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)]'}`}
          >
            <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-xl overflow-hidden animate-slide-up z-50">
              <div className="px-4 py-3 border-b border-border bg-[var(--surface-elevated)] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Onboarding Checklist</h3>
                <span className="badge badge-accent text-[10px]">4 tasks</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {onboardingTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setShowNotifications(false);
                      showCredentialPrompt({ service: task.id as any, feature: 'System Integration' });
                    }}
                    className="w-full text-left p-4 border-b border-border last:border-b-0 hover:bg-[var(--surface-elevated)] transition-colors flex items-start gap-3 group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${task.bg} ${task.color}`}>
                      <task.icon className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {task.desc}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors mt-2" strokeWidth={1.75} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
