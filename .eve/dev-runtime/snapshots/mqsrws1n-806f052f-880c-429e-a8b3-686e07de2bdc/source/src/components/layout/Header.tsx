'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store/app-store';
import {
  Search,
  Sun,
  Moon,
  X,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useRef, useMemo } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Candidates', href: '/candidates' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Clients', href: '/clients' },
];

const moreItems: {label: string, href: string}[] = [];

const allNavItems = [...navItems, ...moreItems];

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { globalSearch, setGlobalSearch, dbCandidates, dbJobs, dbClients } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  
  const moreRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreDropdown(false);
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
    <header className="border-b border-border bg-[var(--surface-overlay)] backdrop-blur-md sticky top-0 z-20 flex flex-col justify-center">
      {/* Top Row */}
      <div className="w-full h-14 flex items-center justify-between px-4 lg:px-8 relative">
        {/* Left: Logo and branding */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden bg-accent/5 border border-accent/20">
              <Image src="/logo.png" alt="Ion Recruitment Logo" width={32} height={32} className="object-cover scale-150 dark:invert-0 invert" />
            </div>
            <span className="text-sm font-semibold tracking-wider text-text-primary uppercase">
              Ion <span className="text-accent font-bold">Recruitment</span>
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5 mx-6">
          {navItems.map(item => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide uppercase transition-all duration-150 ${
                  isActive
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          
          {/* More Dropdown */}
          <div className="relative" ref={moreRef}>
            <button 
              onClick={() => setShowMoreDropdown(!showMoreDropdown)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide uppercase transition-all duration-150 flex items-center gap-1 ${
                showMoreDropdown || moreItems.some(item => pathname.startsWith(item.href))
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)]'
              }`}
            >
              More <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            {showMoreDropdown && (
              <div className="absolute right-0 mt-1.5 bg-[var(--surface-overlay)] border border-border shadow-xl rounded-lg py-1.5 w-48 z-30 animate-fade-in">
                {moreItems.map(item => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      onClick={() => setShowMoreDropdown(false)}
                      className={`block px-4 py-2 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-accent-soft text-accent'
                          : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search Trigger for Mobile */}
          <button
            className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all lg:hidden"
            onClick={() => setShowMobileSearch(true)}
          >
            <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </button>

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all duration-150"
            >
              {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.75} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.75} />}
            </button>
          )}
        </div>

        {/* Mobile Search Overlay */}
        {showMobileSearch && (
          <div className="absolute inset-0 bg-surface z-30 flex items-center px-4 gap-2 border-b border-border animate-fade-in lg:hidden">
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
      </div>

      {/* Mobile Row: Horizontally Scrollable Tabs (All 12 items) */}
      <div className="flex lg:hidden w-full overflow-x-auto no-scrollbar border-t border-border bg-[var(--surface-overlay)] py-2.5 px-4 gap-4 scroll-smooth">
        {allNavItems.map(item => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`text-xs font-semibold tracking-wide uppercase whitespace-nowrap pb-1 border-b-2 transition-colors duration-150 ${
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Mobile Search Results */}
      {showMobileSearch && searchResults && (
        <div className="absolute top-14 left-0 right-0 bg-surface border-b border-border shadow-xl z-40 max-h-[calc(100vh-3.5rem)] overflow-y-auto lg:hidden animate-fade-in">
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
    </header>
  );
}
