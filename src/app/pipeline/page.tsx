'use client';

import { useState, useMemo } from 'react';
import {
  mockCandidates,
  mockJobs,
  candidatePipelineStages,
  jobPipelineStages,
  statusColors,
} from '@/lib/mock-data';
import { Users, Briefcase, Clock, Mail, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type ViewMode = 'candidates' | 'jobs';

const stageColors: Record<string, string> = {
  New: '#4F7BF7',
  Contacted: '#9CA3AF',
  Engaged: '#6395FF',
  Interview: '#E5A50A',
  Submitted: '#F59E0B',
  Placed: '#22C55E',
  Rejected: '#EF4444',
  Open: '#4F7BF7',
  Sourcing: '#E5A50A',
  Interviewing: '#F59E0B',
  Offer: '#22C55E',
  Filled: '#22C55E',
};

export default function PipelinePage() {
  const [view, setView] = useState<ViewMode>('candidates');

  const stages = view === 'candidates' ? candidatePipelineStages : jobPipelineStages;
  const items = view === 'candidates' ? mockCandidates : mockJobs;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Pipeline</h1>
          <p className="text-sm text-text-secondary mt-1">
            Drag-and-drop to move between stages
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-elevated)] border border-border">
          <button
            onClick={() => setView('candidates')}
            className={`btn-xs rounded-md px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
              view === 'candidates'
                ? 'bg-surface text-text-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
            Candidates
          </button>
          <button
            onClick={() => setView('jobs')}
            className={`btn-xs rounded-md px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
              view === 'jobs'
                ? 'bg-surface text-text-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" strokeWidth={1.75} />
            Jobs
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '65vh' }}>
        {stages.map((stage) => {
          const stageItems = items.filter((item) => item.status === stage);
          return (
            <div key={stage} className="pipeline-column min-w-[260px] max-w-[300px] flex flex-col">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: stageColors[stage] }}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {stage}
                  </span>
                </div>
                <span className="text-xs font-mono text-text-tertiary bg-surface px-1.5 py-0.5 rounded">
                  {stageItems.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2">
                {stageItems.map((item) => {
                  if (view === 'candidates') {
                    const candidate = item as typeof mockCandidates[0];
                    const daysSinceContact = candidate.lastContactDate
                      ? Math.floor(
                          (Date.now() - new Date(candidate.lastContactDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : null;
                    const isStale = daysSinceContact !== null && daysSinceContact > 5;

                    return (
                      <Link
                        key={candidate.id}
                        href={`/candidates/${candidate.id}`}
                        className={`pipeline-card block ${
                          isStale ? 'border-warning/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent text-[10px] font-semibold">
                              {candidate.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium text-text-primary">
                              {candidate.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {candidate.skills.slice(0, 2).map((s) => (
                            <span key={s} className="text-[9px] badge badge-neutral px-1.5 py-0">
                              {s}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          {daysSinceContact !== null ? (
                            <span
                              className={`flex items-center gap-1 ${
                                isStale ? 'text-warning' : 'text-text-tertiary'
                              }`}
                            >
                              <Clock className="w-3 h-3" strokeWidth={1.75} />
                              {daysSinceContact}d ago
                            </span>
                          ) : (
                            <span className="text-text-tertiary">No contact</span>
                          )}
                          {candidate.seniority && (
                            <span className="text-text-tertiary">{candidate.seniority}</span>
                          )}
                        </div>
                      </Link>
                    );
                  } else {
                    const job = item as typeof mockJobs[0];
                    return (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="pipeline-card block"
                      >
                        <p className="text-sm font-medium text-text-primary mb-1">{job.title}</p>
                        <p className="text-xs text-text-secondary">{job.client}</p>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-text-tertiary">
                          {job.location && <span>{job.location}</span>}
                          {job.salaryMin && (
                            <span className="font-mono">
                              ${(job.salaryMin / 1000).toFixed(0)}k+
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  }
                })}

                {stageItems.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-xs text-text-tertiary">
                    No items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
