'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Briefcase,
  Mail,
  ExternalLink,
  Trash2,
  Sparkles,
  Loader2,
  MapPin,
  LayoutGrid,
  List
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { statusColors } from '@/lib/mock-data';

function locationTag(loc: string | undefined): string {
  if (!loc || loc === 'Unknown Location') return '—';
  const l = loc.toLowerCase();
  if (/remote/i.test(l)) return 'REM';
  if (/hybrid/i.test(l)) return 'HYB';
  // US state abbreviations
  const usState = loc.match(/,\s*([A-Z]{2})$/); // e.g. "Des Moines, IA"
  if (usState) return usState[1];
  // UK locations
  if (/\buk\b|united kingdom|scotland|england|wales|glasgow|london|surrey|edinburgh|belfast/i.test(l)) return 'UK';
  // Try last word as country/region abbreviation
  const parts = loc.split(/[,\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    if (last.length <= 3) return last.toUpperCase();
    return last.slice(0, 3).toUpperCase();
  }
  return loc.slice(0, 3).toUpperCase();
}

export default function ClientsPage() {
  const { showCredentialPrompt, bypassedServices, hiddenClientIds, hideClient, dbClients, fetchDatabase } = useAppStore();
  const clients = dbClients || [];
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [showSourcing, setShowSourcing] = useState(false);
  const [sourcingQuery, setSourcingQuery] = useState('');
  const [isSourcing, setIsSourcing] = useState(false);

  const handleSourceClients = async () => {
    if (!sourcingQuery) return;
    setIsSourcing(true);
    try {
      const res = await fetch('/api/sourcing/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: sourcingQuery,
          mock: bypassedServices.includes('serpapi')
        }),
      });
      const data = await res.json();
      if (data.error === 'MISSING_API_KEY') {
         showCredentialPrompt({ service: 'serpapi', feature: 'Live Client Sourcing' });
         setIsSourcing(false);
         return;
      }
      if (data.success && data.clients) {
        // Save sourced clients to DB
        await Promise.all(data.clients.map((client: any) => 
          fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
          })
        ));
        
        await fetchDatabase();
        setShowSourcing(false);
        setSourcingQuery('');
      }
    } catch (e) {
      console.error(e);
    }
    setIsSourcing(false);
  };

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (hiddenClientIds.includes(c.id)) return false;
      const matchSearch =
        !search ||
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPerson?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, hiddenClientIds, clients]);

  const availableClients = useMemo(() => clients.filter((c) => !hiddenClientIds.includes(c.id)), [hiddenClientIds, clients]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Clients</h1>
          <p className="text-sm text-text-secondary mt-1">
            {availableClients.length} total &middot; {availableClients.filter((c) => c.status === 'Active').length} active
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn bg-accent-soft text-accent border border-accent/20 hover:bg-accent/10"
            onClick={() => setShowSourcing(!showSourcing)}
          >
            <Sparkles className="w-4 h-4" strokeWidth={1.75} />
            AI Source
          </button>
          <button 
            className="btn btn-primary" 
            id="add-client-btn"
            onClick={() => showCredentialPrompt({ service: 'google-sheets', feature: 'Save New Client' })}
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            Add Client
          </button>
        </div>
      </div>

      {showSourcing && (
        <div className="card bg-[var(--surface-elevated)] p-4 border border-accent/20 flex gap-3 animate-slide-down">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input 
              type="text" 
              className="input pl-10 w-full" 
              placeholder="e.g. Software companies in Surrey hiring..."
              value={sourcingQuery}
              onChange={(e) => setSourcingQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSourceClients()}
              autoFocus
            />
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleSourceClients}
            disabled={isSourcing || !sourcingQuery}
          >
            {isSourcing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sourcing...</>
            ) : (
              'Find Clients'
            )}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Search by company or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            id="client-search"
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'Active', 'Prospect', 'Inactive'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`btn-xs rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] border border-border'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <div className="flex bg-[var(--surface-elevated)] p-1 rounded-md border border-border ml-auto sm:ml-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Client List/Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="card p-5 group hover:shadow-md transition-all duration-150"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-[10px] font-bold tracking-tight flex-shrink-0" title={client.location || 'Unknown'}>
                  {locationTag(client.location)}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${statusColors[client.status] || 'badge-blue'}`}>{client.status}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm(`Are you sure you want to delete ${client.companyName}?`)) {
                        hideClient(client.id);
                      }
                    }}
                    className="p-1 rounded text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
                {client.companyName}
              </h3>
              {client.contactPerson && (
                <p className="text-sm text-text-secondary mt-1">{client.contactPerson}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {client.openRoles} open role{client.openRoles !== 1 ? 's' : ''}
                </span>
                {client.location && client.location !== 'Unknown Location' && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {client.location}
                  </span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {client.email}
                  </span>
                )}
              </div>
              {client.notes && (
                <p className="text-xs text-text-tertiary mt-3 line-clamp-2 leading-relaxed">
                  {client.notes}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary bg-[var(--surface-elevated)] border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(client => (
                  <tr key={client.id} className="hover:bg-[var(--surface-elevated)]/50 transition-colors group">
                    <td className="px-4 py-3">
                      <Link href={`/clients/${client.id}`} className="font-medium text-text-primary hover:text-accent">
                        {client.companyName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {client.contactPerson || '—'}
                      {client.email && client.email !== 'N/A' && <div className="text-xs text-text-tertiary">{client.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{client.location && client.location !== 'Unknown Location' ? client.location : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusColors[client.status] || 'badge-blue'}`}>{client.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm(`Are you sure you want to delete ${client.companyName}?`)) {
                            hideClient(client.id);
                          }
                        }}
                        className="p-1 rounded text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 inline-block"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          <Search className="w-10 h-10 mb-3 text-text-tertiary" strokeWidth={1.25} />
          <p className="text-sm font-medium">No clients found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
