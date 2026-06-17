'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  ExternalLink,
  Calendar,
  MapPin,
  Edit2,
  Sparkles,
  Target,
  Clock,
  MessageSquare,
  Globe,
  FileText,
} from 'lucide-react';
import { mockCandidates, mockJobs, statusColors } from '@/lib/mock-data';

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const candidate = mockCandidates.find((c) => c.id === id);

  if (!candidate) {
    return (
      <div className="empty-state min-h-[60vh]">
        <p className="text-lg font-medium">Candidate not found</p>
        <Link href="/candidates" className="btn btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Back to Candidates
        </Link>
      </div>
    );
  }

  // Mock matched jobs
  const matchedJobs = mockJobs.slice(0, 3).map((j, i) => ({
    ...j,
    fitScore: [92, 78, 65][i],
  }));

  // Mock communication timeline
  const timeline = [
    { date: '2026-06-14', type: 'email', message: 'Initial outreach sent — Full-Stack role at TechVentures' },
    { date: '2026-06-12', type: 'note', message: 'Reviewed resume — strong React and Node.js experience' },
    { date: '2026-06-10', type: 'email', message: 'LinkedIn connection request accepted' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Link
        href="/candidates"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Back to Candidates
      </Link>

      {/* Profile header */}
      <div className="card">
        <div className="px-6 py-5 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent text-lg font-semibold flex-shrink-0">
              {candidate.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{candidate.name}</h1>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-text-secondary">
                {candidate.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {candidate.email}
                  </span>
                )}
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {candidate.phone}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`badge ${statusColors[candidate.status]}`}>
                  {candidate.status}
                </span>
                {candidate.seniority && (
                  <span className="badge badge-neutral">{candidate.seniority}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {candidate.resume && (
                  <a
                    href={candidate.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[var(--surface-elevated)] border border-border text-text-secondary hover:text-accent hover:border-accent/30 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
                    View Resume
                  </a>
                )}
                {candidate.linkedinUrl && (
                  <a
                    href={candidate.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[var(--surface-elevated)] border border-border text-text-secondary hover:text-accent hover:border-accent/30 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                    LinkedIn
                  </a>
                )}
                {candidate.websiteUrl && (
                  <a
                    href={candidate.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[var(--surface-elevated)] border border-border text-text-secondary hover:text-accent hover:border-accent/30 transition-all"
                  >
                    <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/outreach?candidate=${candidate.id}`} className="btn btn-secondary btn-sm">
              <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
              Email
            </Link>
            <button className="btn btn-secondary btn-sm">
              <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details + Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-text-primary">Skills</h2>
            </div>
            <div className="card-body">
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill) => (
                  <span key={skill} className="badge badge-blue text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Resume Summary */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" strokeWidth={1.75} />
                <h2 className="text-base font-semibold text-text-primary">AI Summary</h2>
              </div>
            </div>
            <div className="card-body">
              <p className="text-sm text-text-secondary leading-relaxed">
                {candidate.notes || 'No summary available. Upload a resume to generate an AI-powered candidate analysis.'}
              </p>
            </div>
          </div>

          {/* Communication Timeline */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-text-primary">Activity Timeline</h2>
            </div>
            <div className="divide-y divide-border">
              {timeline.map((event, i) => (
                <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                  <div className="mt-1 p-1.5 rounded-md bg-[var(--surface-elevated)]">
                    {event.type === 'email' ? (
                      <Mail className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={1.75} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-text-primary">{event.message}</p>
                    <p className="text-xs text-text-tertiary mt-1 font-mono">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Matched Jobs */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-accent" strokeWidth={1.75} />
                <h2 className="text-base font-semibold text-text-primary">Job Matches</h2>
              </div>
            </div>
            <div className="divide-y divide-border">
              {matchedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block px-5 py-3.5 hover:bg-[var(--surface-elevated)] transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                        {job.title}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">{job.client}</p>
                    </div>
                    <div
                      className={`score-badge ml-3 ${
                        job.fitScore >= 80
                          ? 'score-high'
                          : job.fitScore >= 60
                          ? 'score-medium'
                          : 'score-low'
                      }`}
                    >
                      {job.fitScore}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Last contact info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-text-primary">Details</h2>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Last Contact
                </span>
                <span className="text-text-primary font-mono text-xs">
                  {candidate.lastContactDate
                    ? new Date(candidate.lastContactDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Never'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Added
                </span>
                <span className="text-text-primary font-mono text-xs">
                  {candidate.createdAt
                    ? new Date(candidate.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
