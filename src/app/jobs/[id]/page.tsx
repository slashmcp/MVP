'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Building2,
  Calendar,
  Sparkles,
  Target,
  Edit2,
  Users,
  Send,
} from 'lucide-react';
import { mockJobs, mockCandidates, statusColors } from '@/lib/mock-data';

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const job = mockJobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="empty-state min-h-[60vh]">
        <p className="text-lg font-medium">Job not found</p>
        <Link href="/jobs" className="btn btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Back to Jobs
        </Link>
      </div>
    );
  }

  const matchedCandidates = mockCandidates.slice(0, 4).map((c, i) => ({
    ...c,
    fitScore: [92, 85, 78, 62][i],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Back to Jobs
      </Link>

      {/* Job header */}
      <div className="card">
        <div className="px-6 py-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`badge ${statusColors[job.status]}`}>{job.status}</span>
              {job.createdAt && (
                <span className="text-xs text-text-tertiary font-mono">
                  Posted {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-text-primary">{job.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" strokeWidth={1.75} />
                {job.client}
              </span>
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" strokeWidth={1.75} />
                  {job.location}
                </span>
              )}
              {job.salaryMin && job.salaryMax && (
                <span className="flex items-center gap-1 font-mono">
                  <DollarSign className="w-4 h-4" strokeWidth={1.75} />
                  ${(job.salaryMin / 1000).toFixed(0)}k – ${(job.salaryMax / 1000).toFixed(0)}k
                </span>
              )}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm">
            <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Requirements + AI Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-text-primary">Requirements</h2>
            </div>
            <div className="card-body">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {job.requirements || 'No requirements specified.'}
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" strokeWidth={1.75} />
                <h2 className="text-base font-semibold text-text-primary">AI Job Analysis</h2>
              </div>
            </div>
            <div className="card-body space-y-4">
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">Ideal Candidate Profile</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  A senior-level engineer with 5+ years of experience in full-stack development. 
                  Strong proficiency in modern JavaScript frameworks (React preferred), backend technologies 
                  (Node.js), and database management. Experience with cloud infrastructure and CI/CD pipelines 
                  is a plus. Should demonstrate leadership ability and excellent communication skills.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">Suggested Sourcing Keywords</h3>
                <div className="flex flex-wrap gap-1.5">
                  {['Full-Stack', 'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Senior Engineer', 'SaaS'].map((kw) => (
                    <span key={kw} className="badge badge-blue text-[10px]">{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Matched Candidates */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-accent" strokeWidth={1.75} />
                <h2 className="text-base font-semibold text-text-primary">Top Matches</h2>
              </div>
              <Link
                href="/matching"
                className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-border">
              {matchedCandidates.map((c) => (
                <Link
                  key={c.id}
                  href={`/candidates/${c.id}`}
                  className="block px-5 py-3.5 hover:bg-[var(--surface-elevated)] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-semibold flex-shrink-0">
                        {c.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                          {c.name}
                        </p>
                        <p className="text-xs text-text-secondary">{c.seniority}</p>
                      </div>
                    </div>
                    <div
                      className={`score-badge ml-3 ${
                        c.fitScore >= 80 ? 'score-high' : c.fitScore >= 60 ? 'score-medium' : 'score-low'
                      }`}
                    >
                      {c.fitScore}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Pipeline stage tracker */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-text-primary">Pipeline Stage</h2>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                {['Open', 'Sourcing', 'Interviewing', 'Offer', 'Filled'].map((stage, i) => {
                  const isActive = stage === job.status;
                  const isPast = ['Open', 'Sourcing', 'Interviewing', 'Offer', 'Filled'].indexOf(stage) <
                    ['Open', 'Sourcing', 'Interviewing', 'Offer', 'Filled'].indexOf(job.status);
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 border-2 ${
                          isActive
                            ? 'border-accent bg-accent'
                            : isPast
                            ? 'border-success bg-success'
                            : 'border-border bg-transparent'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          isActive ? 'font-medium text-accent' : isPast ? 'text-text-secondary' : 'text-text-tertiary'
                        }`}
                      >
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
