'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  MapPin,
  DollarSign,
  Users,
  X,
  Trash2,
  LayoutGrid,
  List,
  Sparkles,
  Loader2
} from 'lucide-react';
import { statusColors, jobPipelineStages } from '@/lib/mock-data';
import { useAppStore } from '@/store/app-store';

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { showCredentialPrompt, bypassedServices, hiddenJobIds, hideJob, addToast, dbJobs, fetchDatabase } = useAppStore();
  const jobs = dbJobs || [];

  // Sourcing State
  const [showSourcing, setShowSourcing] = useState(false);
  const [sourcingQuery, setSourcingQuery] = useState('');
  const [isSourcing, setIsSourcing] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Sort State (list mode)
  type SortKey = 'title' | 'client' | 'location' | 'status' | 'applicants';
  const [sortKey, setSortKey] = useState<SortKey>('title');
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
      const res = await fetch('/api/jobs/deduplicate', { method: 'POST' });
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


  const handleSourceJobs = async () => {
    if (!sourcingQuery) return;
    setIsSourcing(true);
    try {
      const res = await fetch('/api/sourcing/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sourcingQuery }),
      });
      const data = await res.json();
      
      if (data.error === 'MISSING_API_KEY') {
        showCredentialPrompt({ service: 'serpapi', feature: 'Live Job Sourcing' });
        setIsSourcing(false);
        return;
      }
      
      if (data.success && data.jobs) {
        let added = 0;
        let skipped = 0;

        await Promise.all(data.jobs.map(async (sourcedJob: any) => {
          // Dedup logic: check if job with same title and company exists
          const existing = jobs.find(j => 
            j.title.toLowerCase() === sourcedJob.title.toLowerCase() &&
            j.client.toLowerCase() === sourcedJob.client.toLowerCase()
          );

          if (existing) {
            skipped++;
          } else {
            await fetch('/api/jobs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sourcedJob)
            });
            added++;
          }
        }));
        
        await fetchDatabase();
        setShowSourcing(false);
        setSourcingQuery('');
        addToast({
          type: 'success',
          message: `Done! ${added} new job(s) added, ${skipped} duplicate(s) skipped.`
        });
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Sourcing failed. Please try again.' });
    }
    setIsSourcing(false);
  };


  const filtered = useMemo(() => {
    const list = jobs.filter((j) => {
      if (hiddenJobIds.includes(j.id)) return false;
      const matchSearch =
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.client.toLowerCase().includes(search.toLowerCase()) ||
        j.location?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || j.status === statusFilter;
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
  }, [search, statusFilter, hiddenJobIds, jobs, sortKey, sortDir]);

  const availableJobs = useMemo(() => jobs.filter((j) => !hiddenJobIds.includes(j.id)), [hiddenJobIds, jobs]);

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
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} job(s)?`)) return;
    try {
      const res = await fetch('/api/jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        selectedIds.forEach(id => hideJob(id));
        setSelectedIds([]);
        await fetchDatabase();
      } else {
        alert('Failed to delete jobs.');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting jobs.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Jobs</h1>
          <p className="text-sm text-text-secondary mt-1">
            {availableJobs.length} total &middot; {availableJobs.filter((j) => j.status === 'Open').length} open
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            title="Scan and merge duplicate jobs"
          >
            {isDeduping ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-sm">⚡</span>}
            {isDeduping ? 'Deduping...' : 'Dedup DB'}
          </button>
          <button 
            className="btn btn-primary" 
            id="add-job-btn"
            onClick={() => showCredentialPrompt({ service: 'google-sheets', feature: 'Save New Job' })}
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            Add Job
          </button>
        </div>
      </div>

      {showSourcing && (
        <div className="card bg-accent-soft/30 border border-accent/20 animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
            <Sparkles className="w-24 h-24 text-accent" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-accent flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Live Job Sourcing
              </h3>
              <button onClick={() => setShowSourcing(false)} className="text-text-tertiary hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-4 max-w-xl">
              Search Google Jobs to instantly find live vacancies and companies actively hiring. We'll automatically identify duplicates and skip them.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="e.g. React Developer in London"
                  className="input pl-9 w-full"
                  value={sourcingQuery}
                  onChange={(e) => setSourcingQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSourceJobs()}
                />
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleSourceJobs}
                disabled={!sourcingQuery || isSourcing}
              >
                {isSourcing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {isSourcing ? 'Searching...' : 'Search Google Jobs'}
              </button>
            </div>
          </div>
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
            id="select-all-jobs"
          />
          <label htmlFor="select-all-jobs" className="text-xs text-text-secondary cursor-pointer select-none font-medium">
            Select All
          </label>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Search by title, client, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            id="job-search"
          />
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
          {jobPipelineStages.map((stage) => (
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

      {/* Job Cards Grid / List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <div
              key={job.id}
              className={`card p-5 group hover:shadow-md transition-all duration-150 relative border ${
                selectedIds.includes(job.id) ? 'border-accent bg-accent/5' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(job.id)}
                    onChange={(e) => handleCheckboxChange(job.id, e)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50 cursor-pointer"
                  />
                  <span className={`badge ${statusColors[job.status] || 'badge-blue'}`}>{job.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      if (confirm(`Are you sure you want to delete ${job.title}?`)) {
                        try {
                          const res = await fetch(`/api/jobs?id=${job.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            hideJob(job.id);
                            await fetchDatabase();
                          }
                          else alert('Failed to delete job');
                        } catch (e) {
                          console.error(e);
                        }
                      }
                    }}
                    className="p-1 rounded text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors md:opacity-0 md:group-hover:opacity-100"
                    title="Delete Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-text-tertiary font-mono">
                    {job.postedDate
                      ? new Date(job.postedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : ''}
                  </span>
                </div>
              </div>
              <Link href={`/jobs/${job.id}`}>
                <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {job.title}
                </h3>
              </Link>
              <p className="text-sm text-text-secondary mt-1">{job.client}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-text-secondary">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {job.location}
                  </span>
                )}
                {job.salaryMin && job.salaryMax && (
                  <span className="flex items-center gap-1 font-mono">
                    <DollarSign className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {(job.salaryMin / 1000).toFixed(0)}k–{(job.salaryMax / 1000).toFixed(0)}k
                  </span>
                )}
              </div>
              {job.requirements && (
                <p className="text-xs text-text-tertiary mt-3 line-clamp-2 leading-relaxed">
                  {job.requirements}
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
                    { key: 'title', label: 'Role', className: '' },
                    { key: 'client', label: 'Client', className: 'hidden sm:table-cell' },
                    { key: 'location', label: 'Location', className: 'hidden md:table-cell' },
                    { key: 'status', label: 'Status', className: '' },
                    { key: 'applicants', label: 'Applicants', className: 'hidden lg:table-cell' },
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
                {filtered.map(job => (
                  <tr
                    key={job.id}
                    className={`hover:bg-[var(--surface-elevated)]/50 transition-colors group ${
                      selectedIds.includes(job.id) ? 'bg-accent/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(job.id)}
                        onChange={(e) => handleCheckboxChange(job.id, e)}
                        className="rounded border-border text-accent focus:ring-accent/50 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/jobs/${job.id}`} className="font-medium text-text-primary hover:text-accent">
                        {job.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{job.client}</td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{job.location || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusColors[job.status] || 'badge-blue'}`}>{job.status}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-mono hidden lg:table-cell">
                      {job.salaryMin && job.salaryMax ? `${(job.salaryMin / 1000).toFixed(0)}k–${(job.salaryMax / 1000).toFixed(0)}k` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          if (confirm(`Are you sure you want to delete ${job.title}?`)) {
                            try {
                              const res = await fetch(`/api/jobs?id=${job.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                hideJob(job.id);
                                await fetchDatabase();
                              }
                              else alert('Failed to delete job');
                            } catch (e) {
                              console.error(e);
                            }
                          }
                        }}
                        className="p-1 rounded text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 inline-block"
                        title="Delete Job"
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
        availableJobs.length === 0 ? (
          <div className="card p-10 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-8 border border-border bg-surface shadow-md rounded-xl">
            <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center text-accent mb-4">
              <Plus className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Jobs Found</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-md leading-relaxed">
              No job postings exist yet. Create a new vacancy or let AI source them directly from Google Jobs.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => showCredentialPrompt({ service: 'google-sheets', feature: 'Save New Job' })}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" /> Add Job
              </button>
              <button
                onClick={() => setShowSourcing(true)}
                className="btn btn-secondary flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-accent" /> Source Google Jobs
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-10 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-8 border border-border bg-surface shadow-md rounded-xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-text-tertiary mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">No Matching Jobs</h3>
            <p className="text-sm text-text-secondary mb-5 leading-relaxed">
              We couldn't find any jobs matching your search term or active status filters.
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
