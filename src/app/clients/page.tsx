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

export default function ClientsPage() {
  const { showCredentialPrompt, bypassedServices, hiddenClientIds, hideClient, addToast, dbClients, fetchDatabase } = useAppStore();
  const clients = dbClients || [];
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [showSourcing, setShowSourcing] = useState(false);
  const [sourcingQuery, setSourcingQuery] = useState('');
  const [isSourcing, setIsSourcing] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Sort State (list mode)
  type SortKey = 'companyName' | 'location' | 'contactPerson' | 'status' | 'openRoles';
  const [sortKey, setSortKey] = useState<SortKey>('companyName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isDeduping, setIsDeduping] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleDedup = async () => {
    setIsDeduping(true);
    try {
      const res = await fetch('/api/clients/deduplicate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchDatabase();
        addToast({ type: 'success', message: data.message });
      } else {
        addToast({ type: 'error', message: 'Deduplication failed.' });
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'An error occurred during deduplication.' });
    }
    setIsDeduping(false);
  };

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
        let added = 0, merged = 0;

        await Promise.all(data.clients.map(async (sourced: any) => {
          const existing = clients.find(c =>
            c.companyName.toLowerCase() === sourced.companyName.toLowerCase() ||
            (c.linkedinUrl && sourced.linkedinUrl && c.linkedinUrl === sourced.linkedinUrl)
          );

          if (existing) {
            // Merge: new data wins, fall back to existing only when new is empty/unknown
            const isUnknown = (v: any) => !v || v === 'Unknown Location' || v === 'N/A' || v === 'Requires Outreach';
            const payload = {
              id: existing.id,
              linkedinUrl: sourced.linkedinUrl || existing.linkedinUrl,
              location: !isUnknown(sourced.location) ? sourced.location : existing.location,
              industry: !isUnknown(sourced.industry) ? sourced.industry : existing.industry,
              contactPerson: !isUnknown(sourced.contactPerson) ? sourced.contactPerson : existing.contactPerson,
              email: !isUnknown(sourced.email) ? sourced.email : existing.email,
              notes: sourced.notes
                ? (existing.notes ? existing.notes + '\n\n[Re-sourced]: ' : '') + sourced.notes
                : existing.notes,
            };
            await fetch('/api/clients', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            merged++;
          } else {
            await fetch('/api/clients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sourced),
            });
            added++;
          }
        }));

        await fetchDatabase();
        setShowSourcing(false);
        setSourcingQuery('');
        addToast({
          type: 'success',
          message: `Done! ${added} new client${added !== 1 ? 's' : ''} added, ${merged} existing record${merged !== 1 ? 's' : ''} enriched.`
        });
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Sourcing failed. Please try again.' });
    }
    setIsSourcing(false);
  };

  const saveSourcedClients = async (clientsToSave: any[]) => {
    await Promise.all(clientsToSave.map((client: any) =>
      fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      })
    ));
    await fetchDatabase();
  };

  const filtered = useMemo(() => {
    const list = clients.filter((c) => {
      if (hiddenClientIds.includes(c.id)) return false;
      const matchSearch =
        !search ||
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
        c.location?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });

    list.sort((a, b) => {
      const aVal = (a[sortKey] ?? '').toString().toLowerCase();
      const bVal = (b[sortKey] ?? '').toString().toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [search, statusFilter, hiddenClientIds, clients, sortKey, sortDir]);

  const availableClients = useMemo(() => clients.filter((c) => !hiddenClientIds.includes(c.id)), [hiddenClientIds, clients]);

  // Bulk Selection Helpers
  const handleCheckboxChange = (id: string, event: any) => {
    const isShiftPressed = event.nativeEvent?.shiftKey || false;
    
    if (isShiftPressed && lastSelectedId && lastSelectedId !== id) {
      const itemIds = filtered.map(item => item.id);
      const startIdx = itemIds.indexOf(lastSelectedId);
      const endIdx = itemIds.indexOf(id);
      
      if (startIdx !== -1 && endIdx !== -1) {
        const min = Math.min(startIdx, endIdx);
        const max = Math.max(startIdx, endIdx);
        const rangeIds = itemIds.slice(min, max + 1);
        
        const isCurrentlySelected = selectedIds.includes(id);
        if (!isCurrentlySelected) {
          setSelectedIds(prev => Array.from(new Set([...prev, ...rangeIds])));
        } else {
          setSelectedIds(prev => prev.filter(x => !rangeIds.includes(x)));
        }
        setLastSelectedId(id);
        return;
      }
    }
    
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
    setLastSelectedId(id);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(item => item.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} client(s)?`)) return;
    try {
      const res = await fetch('/api/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        selectedIds.forEach(id => hideClient(id));
        setSelectedIds([]);
        await fetchDatabase();
      } else {
        alert('Failed to delete clients.');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting clients.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
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
            className="btn btn-secondary"
            onClick={handleDedup}
            disabled={isDeduping}
            title="Scan and merge duplicate clients"
          >
            {isDeduping ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-sm">⚡</span>}
            {isDeduping ? 'Deduping...' : 'Dedup DB'}
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

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 mr-2">
          <input
            type="checkbox"
            checked={filtered.length > 0 && selectedIds.length === filtered.length}
            ref={(el) => {
              if (el) {
                el.indeterminate = selectedIds.length > 0 && selectedIds.length < filtered.length;
              }
            }}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50 cursor-pointer"
            id="select-all-clients"
          />
          <label htmlFor="select-all-clients" className="text-xs text-text-secondary cursor-pointer select-none font-medium">
            Select All
          </label>
        </div>
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
        <div className="flex gap-1.5 flex-wrap">
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
        <div className="flex bg-[var(--surface-elevated)] p-1 rounded-md border border-border ml-auto">
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
            <div
              key={client.id}
              className={`card p-5 group hover:shadow-md transition-all duration-150 relative border ${
                selectedIds.includes(client.id) ? 'border-accent bg-accent/5' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(client.id)}
                    onChange={(e) => handleCheckboxChange(client.id, e)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent text-[11px] font-medium flex-shrink-0">
                    <MapPin className="w-3 h-3" strokeWidth={2} />
                    {client.location && client.location !== 'Unknown Location' ? client.location : 'No location'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${statusColors[client.status] || 'badge-blue'}`}>{client.status}</span>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      if (confirm(`Are you sure you want to delete ${client.companyName}?`)) {
                        try {
                          const res = await fetch(`/api/clients?id=${client.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            hideClient(client.id);
                            await fetchDatabase();
                          }
                          else alert('Failed to delete client');
                        } catch (e) {
                          console.error(e);
                        }
                      }
                    }}
                    className="p-1 rounded text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Link href={`/clients/${client.id}`}>
                <h3 className="text-base font-semibold text-text-primary hover:text-accent transition-colors">
                  {client.companyName}
                </h3>
              </Link>
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
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary bg-[var(--surface-elevated)] border-b border-border">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = selectedIds.length > 0 && selectedIds.length < filtered.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="rounded border-border text-accent focus:ring-accent/50 cursor-pointer"
                    />
                  </th>
                  {([
                    { key: 'companyName', label: 'Company' },
                    { key: 'contactPerson', label: 'Contact' },
                    { key: 'location', label: 'Location' },
                    { key: 'status', label: 'Status' },
                    { key: 'openRoles', label: 'Open Roles' },
                  ] as { key: SortKey; label: string }[]).map(col => (
                    <th
                      key={col.key}
                      className="px-4 py-3 font-medium cursor-pointer select-none hover:text-text-primary transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        <span className="text-text-tertiary ml-0.5">
                          {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(client => (
                  <tr
                    key={client.id}
                    className={`hover:bg-[var(--surface-elevated)]/50 transition-colors group ${
                      selectedIds.includes(client.id) ? 'bg-accent/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(client.id)}
                        onChange={(e) => handleCheckboxChange(client.id, e)}
                        className="rounded border-border text-accent focus:ring-accent/50 cursor-pointer"
                      />
                    </td>
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
                        onClick={async (e) => {
                          e.preventDefault();
                          if (confirm(`Are you sure you want to delete ${client.companyName}?`)) {
                            try {
                              const res = await fetch(`/api/clients?id=${client.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                hideClient(client.id);
                                await fetchDatabase();
                              }
                              else alert('Failed to delete client');
                            } catch (e) {
                              console.error(e);
                            }
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

      {/* Floating Action Bar for Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--surface-elevated)]/95 backdrop-blur border border-border/80 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-slide-up">
          <span className="text-sm font-semibold text-text-primary">
            {selectedIds.length} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={handleBulkDelete}
            className="btn btn-sm bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-all shadow-md"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            Deselect All
          </button>
        </div>
      )}

    </div>
  );
}
