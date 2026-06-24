'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
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
  List,
  Globe,
  Phone,
  UploadCloud
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { statusColors } from '@/lib/mock-data';

export default function ClientsPage() {
  const { showCredentialPrompt, bypassedServices, hiddenClientIds, hideClient, addToast, dbClients, fetchDatabase } = useAppStore();
  const clients = dbClients || [];
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  
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

  const handleBulkEnrich = async () => {
    setIsEnriching(true);
    let successCount = 0;
    
    try {
      for (const id of selectedIds) {
        const client = clients.find(c => c.id === id);
        if (!client) continue;
        
        try {
          const res = await fetch('/api/clients/enrich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: client.id,
              provider: 'serp',
              companyName: client.companyName,
              location: client.location,
              email: client.email,
              linkedinUrl: client.linkedinUrl,
              websiteUrl: client.websiteUrl,
            })
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.enrichedFields?.length > 0) successCount++;
          }
        } catch (err) {
          console.error(`Failed to enrich client ${id}:`, err);
        }
      }
      
      addToast({
        type: 'success',
        message: `Successfully enriched ${successCount} out of ${selectedIds.length} clients`
      });
      await fetchDatabase();
    } finally {
      setIsEnriching(false);
      setSelectedIds([]);
    }
  };


  const handleImportContacts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      
      const parseResult = Papa.parse<string[]>(text, {
        skipEmptyLines: true,
      });
      
      const rows = parseResult.data;
      if (rows.length === 0) {
        addToast({ type: 'error', message: 'The file is empty.' });
        return;
      }
      
      const headers = rows[0].map(h => h.toLowerCase().trim());
      const companyIdx = headers.findIndex(h => h.includes('company') || h.includes('client') || h.includes('firm') || h.includes('name'));
      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('tel') || h.includes('contact'));
      const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
      const websiteIdx = headers.findIndex(h => h.includes('website') || h.includes('url') || h.includes('site') || h.includes('link'));

      if (companyIdx === -1) {
        addToast({ type: 'error', message: 'Could not find a company name column. Please check headers.' });
        return;
      }

      const records = rows.slice(1).map(cols => {
        return {
          company: cols[companyIdx]?.trim() || '',
          phone: phoneIdx >= 0 ? cols[phoneIdx]?.trim() : '',
          email: emailIdx >= 0 ? cols[emailIdx]?.trim() : '',
          website: websiteIdx >= 0 ? cols[websiteIdx]?.trim() : '',
        };
      }).filter(r => r.company);

      if (records.length === 0) {
        addToast({ type: 'error', message: 'No valid company records found in the file.' });
        return;
      }

      const res = await fetch('/api/clients/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchDatabase();
        const total = (data.updated || 0) + (data.created || 0);
        if (total === 0) {
          const unmatchedMsg = data.unmatched?.length > 0 ? ` (${data.unmatched.length} unmatched)` : '';
          addToast({ type: 'info', message: `No client records were modified.${unmatchedMsg}` });
        } else {
          const parts = [];
          if (data.created > 0) parts.push(`Added ${data.created}`);
          if (data.updated > 0) parts.push(`Updated ${data.updated}`);
          const unmatchedMsg = data.unmatched?.length > 0 ? ` (${data.unmatched.length} unmatched)` : '';
          addToast({ type: 'success', message: `${parts.join(' & ')} client(s)${unmatchedMsg}` });
        }
      } else {
        addToast({ type: 'error', message: data.error || 'Import failed' });
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Failed to import contact data' });
    } finally {
      setIsImporting(false);
      if (importFileRef.current) importFileRef.current.value = '';
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
          <input
            type="file"
            ref={importFileRef}
            onChange={handleImportContacts}
            accept=".csv,.txt"
            className="hidden"
          />
          <button
            className="btn btn-secondary"
            onClick={() => importFileRef.current?.click()}
            disabled={isImporting}
            title="Import contact data from CSV/TXT (Company, Phone, Email, Website)"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" strokeWidth={1.75} />}
            {isImporting ? 'Importing...' : 'Import Contacts'}
          </button>
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
            {isDeduping ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-sm">âš¡</span>}
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
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
                <span className="flex items-center gap-1 text-text-secondary">
                  <Briefcase className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {client.openRoles} open role{client.openRoles !== 1 ? 's' : ''}
                </span>
                {client.location && client.location !== 'Unknown Location' && (
                  <span className="flex items-center gap-1 text-text-secondary">
                    <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {client.location}
                  </span>
                )}
                {client.email && client.email !== 'N/A' && (
                  <Link href={`/outreach?client=${client.id}`} className="flex items-center gap-1 text-blue-500 hover:text-blue-400 transition-colors" title={`Email: ${client.email}`}>
                    <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span className="text-text-secondary">{client.email}</span>
                  </Link>
                )}
                {client.phone && client.phone !== 'N/A' && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-emerald-500 hover:text-emerald-400 transition-colors" title={`Call: ${client.phone}`}>
                    <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span className="text-text-secondary">{client.phone}</span>
                  </a>
                )}
                {client.linkedinUrl && (
                  <a href={client.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#0A66C2] hover:text-[#0A66C2]/80 transition-colors" title="LinkedIn Profile">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
                {client.websiteUrl && (
                  <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-text-secondary hover:text-accent transition-colors" title="Website">
                    <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Website
                  </a>
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
                    { key: 'companyName', label: 'Company', className: '' },
                    { key: 'contactPerson', label: 'Contact', className: 'hidden sm:table-cell' },
                    { key: 'location', label: 'Location', className: 'hidden md:table-cell' },
                    { key: 'status', label: 'Status', className: '' },
                    { key: 'openRoles', label: 'Open Roles', className: 'hidden lg:table-cell' },
                  ] as { key: SortKey; label: string; className: string }[]).map(col => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 font-medium cursor-pointer select-none hover:text-text-primary transition-colors ${col.className}`}
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
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">
                      {client.contactPerson || '—'}
                      {client.email && client.email !== 'N/A' && <div className="text-xs text-text-tertiary">{client.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{client.location && client.location !== 'Unknown Location' ? client.location : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusColors[client.status] || 'badge-blue'}`}>{client.status}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-mono hidden lg:table-cell">{client.openRoles}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Email */}
                        {client.email && client.email !== 'N/A' && (
                          <Link
                            href={`/outreach?client=${client.id}`}
                            className="p-1.5 rounded-md text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                            title={`Email: ${client.email}`}
                          >
                            <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </Link>
                        )}
                        {/* Phone */}
                        {client.phone && client.phone !== 'N/A' && (
                          <a
                            href={`tel:${client.phone}`}
                            className="p-1.5 rounded-md text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                            title={`Call: ${client.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </a>
                        )}
                        {/* LinkedIn */}
                        {client.linkedinUrl && (
                          <a
                            href={client.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-[#0A66C2] hover:text-[#0A66C2]/80 hover:bg-[#0A66C2]/10 transition-all"
                            title="LinkedIn Profile"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </a>
                        )}
                        {/* Website */}
                        {client.websiteUrl && (
                          <a
                            href={client.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-text-tertiary hover:text-accent hover:bg-accent-soft transition-all"
                            title="Website"
                          >
                            <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </a>
                        )}
                        {/* Delete */}
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
                          className="p-1.5 rounded-md text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 ml-1"
                          title="Delete Client"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        availableClients.length === 0 ? (
          <div className="card p-10 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-8 border border-border bg-surface shadow-md rounded-xl">
            <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center text-accent mb-4">
              <Plus className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Clients Found</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-md leading-relaxed">
              No clients are registered yet. Create a new client profile or import contact list from CSV/TXT.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => showCredentialPrompt({ service: 'google-sheets', feature: 'Save New Client' })}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" /> Add Client
              </button>
              <button
                onClick={() => importFileRef.current?.click()}
                className="btn btn-secondary flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4 text-text-secondary" /> Import Contacts
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-10 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-8 border border-border bg-surface shadow-md rounded-xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-text-tertiary mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">No Matching Clients</h3>
            <p className="text-sm text-text-secondary mb-5 leading-relaxed">
              We couldn't find any clients matching your search term or active status filters.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="btn btn-secondary"
            >
              Clear Filters & Search
            </button>
          </div>
        )
      )}

      {/* Floating Action Bar for Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--surface-elevated)]/95 backdrop-blur border border-border/80 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-slide-up">
          <span className="text-sm font-semibold text-text-primary">
            {selectedIds.length} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={handleBulkEnrich}
            disabled={isEnriching}
            className="btn btn-sm bg-accent hover:bg-accent/90 text-white font-medium flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-all shadow-md disabled:opacity-50"
          >
            {isEnriching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isEnriching ? 'Enriching...' : 'Enrich Selected'}
          </button>
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

