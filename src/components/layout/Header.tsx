'use client';

import { useTheme } from 'next-themes';
import { useAppStore } from '@/store/app-store';
import {
  Search,
  Sun,
  Moon,
  Bell,
  Menu,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { globalSearch, setGlobalSearch, setSidebarMobileOpen } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      {/* Left: hamburger + search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="p-2 -ml-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all lg:hidden"
          aria-label="Open menu"
          id="mobile-menu-btn"
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
        </button>

        {/* Search */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
            strokeWidth={1.75}
          />
          <input
            type="text"
            placeholder="Search candidates, jobs, clients..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="input pl-10 py-1.5 bg-[var(--surface-elevated)] border-transparent focus:border-accent text-sm"
            id="global-search"
          />
        </div>

        {/* Mobile search icon */}
        <button
          className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all sm:hidden"
          aria-label="Search"
        >
          <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 ml-2">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all duration-150"
          aria-label="Notifications"
          id="notifications-btn"
        >
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </button>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all duration-150"
            aria-label="Toggle dark mode"
            id="theme-toggle"
          >
            {theme === 'dark' ? (
              <Sun className="w-[18px] h-[18px]" strokeWidth={1.75} />
            ) : (
              <Moon className="w-[18px] h-[18px]" strokeWidth={1.75} />
            )}
          </button>
        )}

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center ml-1 text-accent text-xs font-semibold cursor-pointer hover:bg-accent/20 transition-colors">
          RC
        </div>
      </div>
    </header>
  );
}
