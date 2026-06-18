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
} from 'lucide-react';
import { statusColors, jobPipelineStages } from '@/lib/mock-data';
import { useAppStore } from '@/store/app-store';

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { showCredentialPrompt, hiddenJobIds, hideJob, dbJobs } = useAppStore();
  const jobs = dbJobs || [];

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (hiddenJobIds.includes(j.id)) return false;
      const matchSearch =
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.client.toLowerCase().includes(search.toLowerCase()) ||
        j.location?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, hiddenJobIds, jobs]);

  const availableJobs = useMemo(() => jobs.filter((j) => !hiddenJobIds.includes(j.id)), [hiddenJobIds, jobs]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Jobs</h1>
          <p className="text-sm text-text-secondary mt-1">
            {availableJobs.length} total &middot; {availableJobs.filter((j) => j.status === 'Open').length} open
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          id="add-job-btn"
          onClick={() => showCredentialPrompt({ service: 'google-sheets', feature: 'Save New Job' })}
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          Add Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
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
      </div>

      {/* Job Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="card p-5 group hover:shadow-md transition-all duration-150"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`badge ${statusColors[job.status]}`}>{job.status}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm(`Are you sure you want to delete ${job.title}?`)) {
                      hideJob(job.id);
                    }
                  }}
                  className="p-1 rounded text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Job"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-text-tertiary font-mono">
                {job.createdAt
                  ? new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : ''}
              </span>
            </div>
            <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
              {job.title}
            </h3>
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
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <Search className="w-10 h-10 mb-3 text-text-tertiary" strokeWidth={1.25} />
          <p className="text-sm font-medium">No jobs found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
