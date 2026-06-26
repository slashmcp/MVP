'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import {
  Search,
  Plus,
  Filter,
  Mail,
  ExternalLink,
  ChevronDown,
  X,
  UploadCloud,
  FileText,
  Loader2,
  TableProperties,
  Trash2,
  Sparkles,
  LayoutGrid,
  List,
  MapPin,
  Globe,
  Phone,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { statusColors, candidatePipelineStages } from '@/lib/mock-data';
import { Candidate } from '@/lib/schemas';
import { BulkImportModal } from '@/components/ui/BulkImportModal';
import { useAppStore } from '@/store/app-store';

type CandidateWithMatch = Candidate & {
  aiMatch?: { score: number; reason: string };
};

const ensureAbsoluteUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export default function CandidatesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  const [isAiSearch, setIsAiSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [aiResults, setAiResults] = useState<{candidateId: string; score: number; reason: string}[] | null>(null);

  // Column Visibility States
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    skills: true,
    status: true,
    seniority: true,
    location: true,
    lastContact: true,
  });

  const [showSourcing, setShowSourcing] = useState(false);
  const [sourcingQuery, setSourcingQuery] = useState('');
  const [isSourcing, setIsSourcing] = useState(false);

  // Sort State (list mode)
  type SortKey = 'name' | 'status' | 'seniority' | 'lastContact' | 'skills';
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isDeduping, setIsDeduping] = useState(false);

  const { hiddenCandidateIds, hideCandidate, addToast, dbCandidates, fetchDatabase } = useAppStore();

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
      const res = await fetch('/api/candidates/deduplicate', { method: 'POST' });
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

  const handleSourceCandidates = async () => {
    if (!sourcingQuery) return;
    setIsSourcing(true);
    try {
      const res = await fetch('/api/sourcing/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sourcingQuery })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        await fetchDatabase();
        setShowSourcing(false);
        setSourcingQuery('');
        addToast({
          type: 'success',
          message: `Sourced ${data.count} candidates. Automatically enriched ${data.enrichedCount} with emails/phones!`
        });
      } else {
        addToast({ type: 'error', message: data.error || 'Failed to source candidates.' });
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'An error occurred during sourcing.' });
    }
    setIsSourcing(false);
  };

  const cands = dbCandidates || [];

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: cands }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync with Google Sheets');
      
      addToast({ type: 'success', message: data.message || 'Synced to Google Sheets successfully' });
    } catch (e: any) {
      addToast({ type: 'error', message: e.message || 'An error occurred while syncing' });
    } finally {
      setIsSyncing(false);
    }
  };

  const performAiSearch = async () => {
    if (!search.trim()) {
      setAiResults(null);
      return;
    }
    
    setIsSearching(true);
    try {
      const availableCandidates = cands.filter(c => !hiddenCandidateIds.includes(c.id));
      
      const response = await fetch('/api/ai/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: search,
          candidates: availableCandidates,
        }),
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setAiResults(data.results || []);
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'Failed to perform semantic search' });
    } finally {
      setIsSearching(false);
    }
  };

  const filtered = useMemo(() => {
    let base = cands.filter((c) => !hiddenCandidateIds.includes(c.id)) as CandidateWithMatch[];

    if (isAiSearch && aiResults) {
      base = aiResults
        .filter(r => r.score >= 30) // Only show somewhat reasonable matches
        .map(r => {
          const candidate = base.find(c => c.id === r.candidateId);
          if (!candidate) return null;
          return { ...candidate, aiMatch: r };
        })
        .filter(Boolean) as CandidateWithMatch[];
    } else if (!isAiSearch) {
      // Normal text search
      const matchSearch = (c: Candidate) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase())) ||
        c.email?.toLowerCase().includes(search.toLowerCase());
      base = base.filter(matchSearch);
    }

    base.sort((a, b) => {
      let aVal = (a[sortKey as keyof Candidate] ?? '').toString().toLowerCase();
      let bVal = (b[sortKey as keyof Candidate] ?? '').toString().toLowerCase();
      
      if (sortKey === 'skills') {
         aVal = (a.skills || []).length.toString();
         bVal = (b.skills || []).length.toString();
      }
      
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return base.filter((c) => statusFilter === 'all' || c.status === statusFilter);
  }, [search, statusFilter, hiddenCandidateIds, isAiSearch, aiResults, cands, sortKey, sortDir]);

  const availableCandidates = useMemo(() => cands.filter((c) => !hiddenCandidateIds.includes(c.id)), [hiddenCandidateIds, cands]);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

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
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} candidate(s)?`)) return;
    try {
      const res = await fetch('/api/candidates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        selectedIds.forEach(id => hideCandidate(id));
        setSelectedIds([]);
        await fetchDatabase();
        addToast({ type: 'success', message: 'Candidates deleted successfully' });
      } else {
        addToast({ type: 'error', message: 'Failed to delete candidates' });
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Error deleting candidates' });
    }
  };

  const [isBulkEnriching, setIsBulkEnriching] = useState(false);

  const handleBulkEnrich = async () => {
    setIsBulkEnriching(true);
    let successCount = 0;
    try {
      for (const id of selectedIds) {
        const candidate = cands.find(c => c.id === id);
        if (!candidate) continue;
        
        const res = await fetch('/api/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId: candidate.id,
            provider: 'apollo',
            name: candidate.name,
            company: candidate.company,
            email: candidate.email,
            linkedinUrl: candidate.linkedinUrl
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.enrichedFields) {
            successCount++;
          }
        } else {
           const errData = await res.json().catch(() => ({}));
           addToast({ type: 'error', message: errData.error || `Enrichment failed (Status ${res.status})` });
           break;
        }
      }
      
      if (successCount > 0) {
        addToast({ type: 'success', message: `Successfully enriched ${successCount} candidate(s)` });
        await fetchDatabase();
        setSelectedIds([]);
      } else {
        addToast({ type: 'info', message: 'No new data found or API error.' });
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'An error occurred during bulk enrichment' });
    }
    setIsBulkEnriching(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Candidates</h1>
          <p className="text-sm text-text-secondary mt-1">
            {availableCandidates.length} total &middot; {availableCandidates.filter((c) => c.status !== 'Rejected' && c.status !== 'Placed').length} active
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
            title="Scan and merge duplicate candidates"
          >
            {isDeduping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isDeduping ? 'Deduping...' : 'Dedup DB'}
          </button>

          <button
            onClick={() => setShowBulkImportModal(true)}
            className="btn btn-secondary"
            id="import-csv-btn"
          >
            <TableProperties className="w-4 h-4" strokeWidth={1.75} />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            id="add-candidate-btn"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            Add Candidate
          </button>
        </div>
      </div>

      {showAddModal && <AddCandidateModal onClose={() => setShowAddModal(false)} />}
      {showBulkImportModal && <BulkImportModal onClose={() => setShowBulkImportModal(false)} />}

      {/* Sourcing Search Bar */}
      {showSourcing && (
        <div className="card bg-accent/5 border-accent/20 p-4 mb-6 animate-fade-in flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
            <input 
              type="text" 
              placeholder="e.g. 'Software Engineer in Glasgow'"
              className="input w-full pl-9 border-accent/20 focus:border-accent focus:ring-accent/20 bg-background"
              value={sourcingQuery}
              onChange={(e) => setSourcingQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSourceCandidates()}
            />
          </div>
          <button 
            className="btn btn-primary whitespace-nowrap"
            onClick={handleSourceCandidates}
            disabled={isSourcing || !sourcingQuery}
          >
            {isSourcing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isSourcing ? 'Sourcing & Enriching...' : 'Start AI Sourcing'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
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
            id="select-all-candidates"
          />
          <label htmlFor="select-all-candidates" className="text-xs text-text-secondary cursor-pointer select-none font-medium">
            Select All
          </label>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-sm flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" strokeWidth={1.75} />
            <input
              type="text"
              placeholder={isAiSearch ? "Ask AI: e.g. 'Senior React dev with AWS'" : "Search by name, skill, or email..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (isAiSearch && !e.target.value) setAiResults(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isAiSearch) {
                  performAiSearch();
                }
              }}
              className={`input pl-10 ${isAiSearch ? 'pr-10 border-accent/30 focus:border-accent/50 focus:ring-accent/20 bg-accent/5' : ''}`}
              id="candidate-search"
            />
            {isAiSearch && search && (
               <button 
                onClick={performAiSearch} 
                disabled={isSearching} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-accent hover:bg-accent/10 transition-colors"
                title="Search with AI"
               >
                 {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
               </button>
            )}
          </div>
          <button
            onClick={() => {
               setIsAiSearch(!isAiSearch);
               setAiResults(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all shrink-0 ${
              isAiSearch 
                ? 'bg-accent/10 border-accent/20 text-accent' 
                : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)]'
            }`}
            title="Toggle Semantic AI Search"
          >
            <Sparkles className="w-4 h-4" strokeWidth={1.75} />
            AI Search
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`btn-xs rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-accent-soft text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] border border-border'
            }`}
          >
            All
          </button>
          {candidatePipelineStages.map((stage) => (
            <button
              key={stage}
              onClick={() => setStatusFilter(stage)}
              className={`btn-xs rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === stage
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] border border-border'
              }`}
            >
              {stage}
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
        {viewMode === 'list' && (
          <div className="relative">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium bg-surface text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all"
              title="Columns Visibility"
            >
              <Eye className="w-4 h-4" />
              <span>Columns</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showColumnDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowColumnDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-surface p-2.5 shadow-xl z-20 space-y-2 animate-fade-in">
                  <p className="text-xs font-semibold text-text-secondary px-2 py-1">Toggle Columns</p>
                  <hr className="border-border" />
                  <div className="space-y-1.5">
                    {([
                      { key: 'skills', label: 'Skills' },
                      { key: 'status', label: 'Status' },
                      { key: 'seniority', label: 'Seniority' },
                      { key: 'location', label: 'Location' },
                      { key: 'lastContact', label: 'Last Contact' },
                    ] as { key: string; label: string }[]).map((col) => (
                      <label
                        key={col.key}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--surface-elevated)] cursor-pointer select-none text-sm text-text-secondary hover:text-text-primary transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.key]}
                          onChange={() =>
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [col.key]: !prev[col.key],
                            }))
                          }
                          className="rounded border-border text-accent focus:ring-accent/50 cursor-pointer"
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Table / Grid */}
      {viewMode === 'list' ? (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
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
                  { key: 'name', label: 'Name', required: true, className: '' },
                  { key: 'skills', label: 'Skills', required: false, className: 'hidden md:table-cell' },
                  { key: 'status', label: 'Status', required: false, className: 'hidden sm:table-cell' },
                  { key: 'seniority', label: 'Seniority', required: false, className: 'hidden lg:table-cell' },
                  { key: 'location', label: 'Location', required: false, className: 'hidden lg:table-cell' },
                  { key: 'lastContact', label: 'Last Contact', required: false, className: 'hidden xl:table-cell' },
                ] as { key: string; label: string; required: boolean; className: string }[])
                  .filter(col => col.required || visibleColumns[col.key])
                  .map(col => (
                    <th
                      key={col.key}
                      className={`cursor-pointer select-none hover:text-text-primary transition-colors ${col.className}`}
                      onClick={() => handleSort(col.key as SortKey)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        <span className="text-text-tertiary ml-0.5">
                          {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </span>
                    </th>
                  ))}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((candidate) => (
                <tr key={candidate.id} className={selectedIds.includes(candidate.id) ? 'bg-accent/5' : ''}>
                  <td className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(candidate.id)}
                      onChange={(e) => handleCheckboxChange(candidate.id, e)}
                      className="rounded border-border text-accent focus:ring-accent/50 cursor-pointer"
                    />
                  </td>
                  <td>
                    <Link
                      href={`/candidates/${candidate.id}`}
                      className="group block"
                    >
                      <div className="font-medium text-text-primary group-hover:text-accent transition-colors flex items-center gap-2">
                        {candidate.name}
                        {candidate.aiMatch && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                            candidate.aiMatch.score >= 80 ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {candidate.aiMatch.score}% Match
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {candidate.email}
                      </div>
                      {candidate.aiMatch && (
                        <div className="text-xs text-text-secondary mt-1.5 flex items-start gap-1.5 bg-accent/5 p-1.5 rounded border border-accent/10">
                          <Sparkles className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                          <span className="italic leading-relaxed">{candidate.aiMatch.reason}</span>
                        </div>
                      )}
                    </Link>
                  </td>
                  {visibleColumns.skills && (
                    <td className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[280px]">
                        {candidate.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="badge badge-neutral text-[10px]"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 3 && (
                          <span className="text-[10px] text-text-tertiary">
                            +{candidate.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="hidden sm:table-cell">
                      <span className={`badge ${statusColors[candidate.status] || 'badge-neutral'}`}>
                        {candidate.status}
                      </span>
                    </td>
                  )}
                  {visibleColumns.seniority && (
                    <td className="text-text-secondary text-sm hidden lg:table-cell">
                      {candidate.seniority || '—'}
                    </td>
                  )}
                  {visibleColumns.location && (
                    <td className="text-text-secondary text-sm hidden lg:table-cell">
                      {candidate.location || '—'}
                    </td>
                  )}
                  {visibleColumns.lastContact && (
                    <td className="text-text-secondary font-mono text-xs hidden xl:table-cell">
                      {candidate.lastContactDate
                        ? new Date(candidate.lastContactDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                  )}
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Email */}
                      {candidate.email && candidate.email !== 'N/A' && (
                        <a
                          href={`mailto:${candidate.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                          title={`Email: ${candidate.email}`}
                        >
                          <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </a>
                      )}
                      {/* Phone */}
                      {candidate.phone && candidate.phone !== 'N/A' && (
                        <a
                          href={`tel:${candidate.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                          title={`Call: ${candidate.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </a>
                      )}
                      {/* LinkedIn */}
                      {candidate.linkedinUrl && (
                        <a
                          href={ensureAbsoluteUrl(candidate.linkedinUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md text-[#0A66C2] hover:text-[#0A66C2]/80 hover:bg-[#0A66C2]/10 transition-all"
                          title="LinkedIn Profile"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      )}
                      {/* Website */}
                      {candidate.websiteUrl && (
                        <a
                          href={ensureAbsoluteUrl(candidate.websiteUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
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
                          if (confirm(`Are you sure you want to delete ${candidate.name}?`)) {
                            try {
                              const res = await fetch(`/api/candidates?id=${candidate.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                hideCandidate(candidate.id);
                                await fetchDatabase();
                                addToast({ type: 'success', message: 'Candidate deleted successfully' });
                              } else {
                                addToast({ type: 'error', message: 'Failed to delete candidate' });
                              }
                            } catch (e) {
                              console.error(e);
                              addToast({ type: 'error', message: 'Error deleting candidate' });
                            }
                          }
                        }}
                        className="p-1.5 rounded-md text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all ml-1"
                        title="Delete Candidate"
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((candidate) => (
            <div
              key={candidate.id}
              className={`card p-5 group hover:shadow-md transition-all duration-150 block relative border ${
                selectedIds.includes(candidate.id) ? 'border-accent bg-accent/5' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(candidate.id)}
                    onChange={(e) => handleCheckboxChange(candidate.id, e)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50 cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-semibold flex-shrink-0">
                    {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <Link href={`/candidates/${candidate.id}`}>
                      <div className="font-medium text-text-primary group-hover:text-accent transition-colors flex items-center gap-2">
                        {candidate.name}
                        {candidate.aiMatch && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                            candidate.aiMatch.score >= 80 ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {candidate.aiMatch.score}% Match
                          </span>
                        )}
                      </div>
                    </Link>
                    {candidate.role && (
                      <p className="text-xs text-text-secondary mt-0.5">{candidate.role}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${statusColors[candidate.status] || 'badge-blue'}`}>{candidate.status}</span>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      if (confirm(`Are you sure you want to delete ${candidate.name}?`)) {
                        try {
                          const res = await fetch(`/api/candidates?id=${candidate.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            hideCandidate(candidate.id);
                            await fetchDatabase();
                            addToast({ type: 'success', message: 'Candidate deleted successfully' });
                          } else {
                            addToast({ type: 'error', message: 'Failed to delete candidate' });
                          }
                        } catch (e) {
                          console.error(e);
                          addToast({ type: 'error', message: 'Error deleting candidate' });
                        }
                      }
                    }}
                    className="p-1 rounded text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors md:opacity-0 md:group-hover:opacity-100"
                    title="Delete Candidate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {candidate.aiMatch && (
                <div className="text-xs text-text-secondary mb-3 mt-1.5 flex items-start gap-1.5 bg-accent/5 p-1.5 rounded border border-accent/10">
                  <Sparkles className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                  <span className="italic leading-relaxed">{candidate.aiMatch.reason}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1 mt-4">
                {candidate.skills.slice(0, 4).map((skill, i) => (
                  <span key={i} className="badge badge-gray text-[10px] px-1.5 py-0">
                    {skill}
                  </span>
                ))}
                {candidate.skills.length > 4 && (
                  <span className="text-xs text-text-tertiary ml-1">+{candidate.skills.length - 4}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
                {candidate.email && candidate.email !== 'N/A' && (
                  <a href={`mailto:${candidate.email}`} className="flex items-center gap-1 text-blue-500 hover:text-blue-400 transition-colors" title={`Email: ${candidate.email}`}>
                    <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span className="text-text-secondary">{candidate.email}</span>
                  </a>
                )}
                {candidate.phone && candidate.phone !== 'N/A' && (
                  <a href={`tel:${candidate.phone}`} className="flex items-center gap-1 text-emerald-500 hover:text-emerald-400 transition-colors" title={`Call: ${candidate.phone}`}>
                    <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span className="text-text-secondary">{candidate.phone}</span>
                  </a>
                )}
                {candidate.location && candidate.location !== 'Unknown Location' && (
                  <span className="flex items-center gap-1 text-text-secondary">
                    <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {candidate.location}
                  </span>
                )}
                {candidate.linkedinUrl && (
                  <a href={ensureAbsoluteUrl(candidate.linkedinUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#0A66C2] hover:text-[#0A66C2]/80 transition-colors" title="LinkedIn Profile">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
                {candidate.websiteUrl && (
                  <a href={ensureAbsoluteUrl(candidate.websiteUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-text-secondary hover:text-accent transition-colors" title="Website">
                    <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
        {filtered.length === 0 && (
          availableCandidates.length === 0 ? (
            <div className="card p-10 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-8 border border-border bg-surface shadow-md rounded-xl">
              <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center text-accent mb-4">
                <Plus className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Candidates Found</h3>
              <p className="text-sm text-text-secondary mb-6 max-w-md leading-relaxed">
                Get started by adding your first candidate manually, importing a CSV file, or dropping resumes into the Master Funnel on the dashboard.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4" /> Add Candidate
                </button>
                <button
                  onClick={() => setShowBulkImportModal(true)}
                  className="btn btn-secondary"
                >
                  <TableProperties className="w-4 h-4" /> Import CSV
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-10 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-8 border border-border bg-surface shadow-md rounded-xl animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-text-tertiary mb-3">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">No Matching Candidates</h3>
              <p className="text-sm text-text-secondary mb-5 leading-relaxed">
                We couldn't find any candidates matching your search term or status filters. Try clearing them to see all candidates.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setAiResults(null);
                  setIsAiSearch(false);
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
            disabled={isBulkEnriching}
            className="btn btn-secondary btn-sm"
          >
            {isBulkEnriching ? 'Enriching...' : 'Enrich Data'}
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

function AddCandidateModal({ onClose }: { onClose: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Global clipboard paste listener - fires when modal is mounted
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (isParsing) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      let fileToUpload: File | null = null;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const ext = item.type.split('/')[1] || 'png';
            fileToUpload = new File([blob], `screenshot_${Date.now()}.${ext}`, { type: item.type });
            break;
          }
        }
      }
      if (!fileToUpload) {
        const text = e.clipboardData?.getData('text');
        if (text && text.trim().length > 20) {
          fileToUpload = new File([text], `pasted_${Date.now()}.txt`, { type: 'text/plain' });
        }
      }
      if (fileToUpload) {
        e.preventDefault();
        await processFile(fileToUpload);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isParsing]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    websiteUrl: '',
    resume: '',
    skills: '',
    notes: '',
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    ];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isAllowed = validTypes.includes(file.type) || ['pdf','docx','doc','txt','png','jpg','jpeg','webp'].includes(ext);
    if (!isAllowed) {
      setParseError('Unsupported format. Use PDF, DOCX, TXT, or paste a screenshot.');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const data = new FormData();
      data.append('file', file);

      // 1. Upload the file to Supabase Storage
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      let resumeUrl = '';
      if (uploadRes.ok) {
         const uploadData = await uploadRes.json();
         resumeUrl = uploadData.url;
      }

      // 2. Universal Intake AI
      const response = await fetch('/api/intake', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        throw new Error('Failed to parse input');
      }

      const { category, data: parsedData } = await response.json();
      const { dbCandidates, addToast, fetchDatabase } = useAppStore.getState();

      if (category === 'client_list') {
        // Automatically merge clients
        addToast({ type: 'success', message: 'Client list detected! Updating database...' });
        const updateRes = await fetch('/api/clients/bulk-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: parsedData.records || parsedData }),
        });
        const updateData = await updateRes.json();
        if (updateData.success) {
          await fetchDatabase();
          const unmatchedMsg = updateData.unmatched?.length > 0 ? ` (${updateData.unmatched.length} unmatched)` : '';
          addToast({ type: 'success', message: `Successfully updated ${updateData.updated} clients${unmatchedMsg}.` });
        } else {
          addToast({ type: 'error', message: 'Failed to update clients.' });
        }
        setIsParsing(false);
        onClose();
        return;
      }

      if (category === 'job_description') {
        addToast({ type: 'success', message: 'Job Description detected! Pre-filling form (Coming Soon).' });
        // Stretch goal: redirect or fill job form
        setIsParsing(false);
        onClose();
        return;
      }

      // Default: candidate
      const existingCandidate = dbCandidates?.find(c => 
        (c.email && parsedData.email && c.email.toLowerCase() === parsedData.email.toLowerCase()) || 
        (c.name && parsedData.name && c.name.toLowerCase() === parsedData.name.toLowerCase())
      );

      if (existingCandidate) {
        addToast({ type: 'success', message: `Matched existing candidate: ${existingCandidate.name}. Data will be appended.` });
        setExistingId(existingCandidate.id);
      }

      setFormData({
        name: parsedData.name || existingCandidate?.name || '',
        email: parsedData.email || existingCandidate?.email || '',
        phone: parsedData.phone || existingCandidate?.phone || '',
        linkedinUrl: formData.linkedinUrl || existingCandidate?.linkedinUrl || '',
        websiteUrl: formData.websiteUrl || existingCandidate?.websiteUrl || '',
        resume: resumeUrl || existingCandidate?.resume || '',
        skills: Array.isArray(parsedData.skills) && parsedData.skills.length > 0 ? parsedData.skills.join(', ') : (existingCandidate ? existingCandidate.skills.join(', ') : ''),
        notes: parsedData.notes || existingCandidate?.notes || formData.notes || '',
      });
      
    } catch (err) {
      console.error(err);
      setParseError('Failed to parse resume. Please enter details manually.');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const { addToast, fetchDatabase } = useAppStore.getState();
    setIsSaving(true);
    try {
      const payload = existingId ? { ...formData, id: existingId } : formData;
      const method = existingId ? 'PATCH' : 'POST';
      
      const res = await fetch('/api/candidates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to save candidate');
      
      addToast({ type: 'success', message: existingId ? 'Candidate updated successfully!' : 'Candidate added successfully!' });
      await fetchDatabase();
      onClose();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'An error occurred while saving the candidate.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Add Candidate</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
        
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Drag & Drop Upload Zone */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Auto-fill from Resume, Profile, or Screenshot</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-6 transition-colors text-center cursor-pointer ${
                isDragging 
                  ? 'border-accent bg-accent/5' 
                  : 'border-border hover:border-accent/50 bg-[var(--surface-elevated)]'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="application/pdf,.docx,.doc,text/plain,image/*" 
                className="hidden" 
              />
              
              {isParsing ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-text-primary">AI is analyzing resume...</p>
                  <p className="text-xs text-text-secondary">Extracting skills, experience, and contact info</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-1">
                    <UploadCloud className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Click, drag & drop, or Ctrl+V to paste</p>
                  <p className="text-xs text-text-secondary">PDF Â· DOCX Â· TXT Â· or paste a screenshot / copied text</p>
                </div>
              )}
            </div>
            {parseError && (
              <p className="text-xs text-error mt-2">{parseError}</p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-surface text-xs text-text-tertiary">Or enter manually</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" placeholder="e.g. Jane Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" placeholder="jane@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">LinkedIn URL</label>
                <input type="url" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className="input" placeholder="https://linkedin.com/in/..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Personal Website</label>
                <input type="url" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className="input" placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Resume URL (Optional)</label>
              <input type="url" name="resume" value={formData.resume} onChange={handleChange} className="input" placeholder="Link to PDF/Doc..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Skills (comma separated)</label>
              <input type="text" name="skills" value={formData.skills} onChange={handleChange} className="input" placeholder="React, TypeScript, Node.js" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Notes (AI Summary)</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="input min-h-[80px] resize-none" placeholder="Any relevant notes..." />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-[var(--surface-elevated)]">
          <button onClick={onClose} className="btn btn-secondary" disabled={isParsing || isSaving}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={isParsing || isSaving}>
            {!existingId && <Plus className="w-4 h-4" strokeWidth={1.75} />}
            {isSaving ? 'Saving...' : existingId ? 'Update Candidate' : 'Save Candidate'}
          </button>
        </div>
      </div>
    </div>
  );
}

