'use client';

import { useTheme } from 'next-themes';
import { useAppStore } from '@/store/app-store';
import {
  Search,
  Sun,
  Moon,
  Bell,
  Menu,
  Database,
  Sparkles,
  Mail,
  Workflow,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { globalSearch, setGlobalSearch, setSidebarMobileOpen, showCredentialPrompt } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Close notifications when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
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
  ];

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
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-md transition-all duration-150 ${showNotifications ? 'bg-[var(--surface-elevated)] text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)]'}`}
            aria-label="Notifications"
            id="notifications-btn"
          >
            <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          </button>

          {/* Notifications Dropdown */}
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
