'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  ClipboardList,
  Mail,
  GitBranchPlus,
  BarChart3,
  Zap,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  X,
  Workflow,
  Search,
  Globe,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Candidates', href: '/candidates', icon: Users },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Clients', href: '/clients', icon: Building2 },
  { label: 'Placements', href: '/placements', icon: ClipboardList },
  { label: 'Outreach', href: '/outreach', icon: Mail },
  { label: 'Sequences', href: '/sequences', icon: Workflow },
  { label: 'Pipeline', href: '/pipeline', icon: GitBranchPlus },
  { label: 'Matching', href: '/matching', icon: Crosshair },
  { label: 'Market Scraper', href: '/sourcing/clients', icon: Search },
  { label: 'Find Vacancies', href: '/vacancies', icon: Globe },
  { label: 'Daily Briefing', href: '/briefing', icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-screen flex flex-col border-r border-border bg-[var(--surface-overlay)] backdrop-blur-md z-50 transition-all duration-200
          
          /* Mobile: slide-in drawer */
          ${sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          w-64
          
          /* Desktop: always visible, respect collapse */
          lg:translate-x-0
          ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-60'}
        `}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => setSidebarMobileOpen(false)}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image src="/logo.png" alt="Ion Recruitment Logo" width={40} height={40} className="object-cover scale-150 opacity-100 dark:invert-0 invert" />
            </div>
            {(!sidebarCollapsed || sidebarMobileOpen) && (
              <span className="text-sm font-semibold text-text-primary whitespace-nowrap overflow-hidden lg:block uppercase tracking-wider">
                Ion Recruitment
              </span>
            )}
          </Link>
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarMobileOpen(false)}
            className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 lg:py-2 rounded-md text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)]'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${
                    isActive ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'
                  }`}
                  strokeWidth={1.75}
                />
                {(!sidebarCollapsed || sidebarMobileOpen) && (
                  <span className="whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="p-2 border-t border-border hidden lg:block">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center py-2 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-[var(--surface-elevated)] transition-all duration-150"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
