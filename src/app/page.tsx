'use client';

import { useState } from 'react';
import {
  Sparkles,
  Search,
  Users,
  Building2,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/store/app-store';
import {
  mockCandidates,
  mockClients,
  statusColors,
} from '@/lib/mock-data';

export default function DashboardPage() {
  const { hiddenCandidateIds, hiddenClientIds } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const activeCandidates = mockCandidates
    .filter(c => !hiddenCandidateIds.includes(c.id))
    .slice(0, 5);

  const activeClients = mockClients
    .filter(c => !hiddenClientIds.includes(c.id) && c.status === 'Active')
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Command Center</h1>
        <p className="text-sm text-text-secondary mt-1">
          Your unified recruitment and sourcing overview.
        </p>
      </div>

      {/* Quick Source Banner (The New V2 Focus) */}
      <div className="card bg-accent-soft border border-accent/20 overflow-hidden relative">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="p-6 relative z-10 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 space-y-3">
            <h2 className="text-lg font-semibold text-accent flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Sourcing Engine
            </h2>
            <p className="text-sm text-text-secondary max-w-lg">
              Paste a Job Description or enter a role title. The AI will instantly search Google and LinkedIn to find the top matches.
            </p>
            <div className="relative max-w-xl flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input 
                  type="text" 
                  className="input pl-10 w-full bg-surface border-border focus:border-accent/50" 
                  placeholder="e.g. Senior Frontend Engineer with Next.js..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Link href="/jobs" className="btn btn-primary bg-accent hover:bg-accent-hover text-white border-transparent shadow-accent/25 shrink-0">
                Start Sourcing
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Left Column: Recent Candidates */}
        <div className="card flex flex-col min-h-[400px]">
          <div className="card-header border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <h2 className="text-base font-semibold text-text-primary">Recent Candidates</h2>
            </div>
            <Link href="/candidates" className="text-sm font-medium text-accent hover:text-accent-hover flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="card-body p-0 divide-y divide-border flex-1">
            {activeCandidates.length > 0 ? (
              activeCandidates.map(candidate => (
                <Link key={candidate.id} href={`/candidates/${candidate.id}`} className="block p-4 hover:bg-[var(--surface-elevated)] transition-colors group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{candidate.name}</h3>
                      <p className="text-xs text-text-secondary mt-1">{candidate.role}</p>
                    </div>
                    <span className={`badge ${statusColors[candidate.status] || 'badge-blue'}`}>{candidate.status}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center text-text-tertiary h-full">
                <Users className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium text-text-secondary">No candidates yet</p>
                <p className="text-xs mt-1">Use the AI Sourcing Engine to find candidates.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Clients */}
        <div className="card flex flex-col min-h-[400px]">
          <div className="card-header border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              <h2 className="text-base font-semibold text-text-primary">Active Clients</h2>
            </div>
            <Link href="/clients" className="text-sm font-medium text-accent hover:text-accent-hover flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="card-body p-0 divide-y divide-border flex-1">
            {activeClients.length > 0 ? (
              activeClients.map(client => (
                <Link key={client.id} href={`/clients/${client.id}`} className="block p-4 hover:bg-[var(--surface-elevated)] transition-colors group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{client.companyName}</h3>
                      <p className="text-xs text-text-secondary mt-1">{client.industry} &middot; {client.location}</p>
                    </div>
                    <span className={`badge ${statusColors[client.status] || 'badge-blue'}`}>{client.status}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center text-text-tertiary h-full">
                <Building2 className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium text-text-secondary">No active clients</p>
                <p className="text-xs mt-1">Add clients to see them here.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
