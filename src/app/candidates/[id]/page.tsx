'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  ExternalLink,
  Calendar,
  MapPin,
  Edit2,
  Globe,
  MessageSquare,
  FileText,
  Sparkles,
  Plus,
} from 'lucide-react';
import { statusColors } from '@/lib/mock-data';
import { useAppStore } from '@/store/app-store';
import { EditCandidateModal } from '@/components/ui/EditCandidateModal';

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { dbCandidates, dbJobs, fetchDatabase, addToast } = useAppStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  
  const cands = dbCandidates || [];
  const jobs = dbJobs || [];
  
  const candidate = cands.find((c) => c.id === id);

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
  const matchedJobs = jobs.slice(0, 3).map((j, i) => ({
    ...j,
    fitScore: [92, 78, 65][i],
  }));

  // Mock communication timeline
  const timeline = [
    { date: '2026-06-14', type: 'email', message: 'Initial outreach sent — Full-Stack role at TechVentures' },
    { date: '2026-06-12', type: 'note', message: 'Reviewed resume — strong React and Node.js experience' },
    { date: '2026-06-10', type: 'email', message: 'LinkedIn connection request accepted' },
  ];

  const handleEnrich = async (provider: string) => {
    setIsEnriching(true);
    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          provider,
          name: candidate.name,
          company: candidate.company,
          email: candidate.email,
          linkedinUrl: candidate.linkedinUrl
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast({ type: 'success', message: data.message || `Successfully enriched via ${provider}` });
        fetchDatabase(); // Refresh the data to show new details
      } else {
        addToast({ type: 'error', message: data.error || `Failed to enrich via ${provider}` });
      }
    } catch (err) {
      const error = err as Error;
      addToast({ type: 'error', message: error.message || 'An error occurred during enrichment' });
    } finally {
      setIsEnriching(false);
    }
  };

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
              {candidate.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{candidate.name}</h1>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-text-secondary">
                {candidate.email && (
                  <a href={`mailto:${candidate.email}`} className="flex items-center gap-1 hover:text-accent transition-colors">
                    <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {candidate.email}
                  </a>
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
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {candidate.linkedinUrl && (
                  <a
                    href={candidate.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-[#0a66c2] transition-colors py-1 px-2 rounded-md hover:bg-[#0a66c2]/10"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
                {candidate.websiteUrl ? (
                  <a
                    href={candidate.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors py-1 px-2 rounded-md hover:bg-accent/10"
                  >
                    <Globe className="w-4 h-4" />
                    Portfolio
                  </a>
                ) : (
                  <button 
                    onClick={async () => {
                      const url = prompt('Enter Website URL (e.g. https://portfolio.com):');
                      if (url) {
                         const payload = { id: candidate.id, websiteUrl: url };
                         await fetch('/api/candidates', { method: 'PATCH', body: JSON.stringify(payload) });
                         window.location.reload();
                      }
                    }}
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors py-1 px-2 rounded-md hover:bg-accent/10 border border-dashed border-border"
                  >
                    <Globe className="w-4 h-4" />
                    Add Website
                  </button>
                )}
                {candidate.resume && (
                  <a
                    href={candidate.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors py-1 px-2 rounded-md hover:bg-accent/10 ml-auto bg-accent/5 border border-accent/20"
                  >
                    <FileText className="w-4 h-4" />
                    View Resume
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
            {candidate.phone && candidate.phone !== 'N/A' && (
              <>
                <a href={`tel:${candidate.phone}`} className="btn btn-secondary btn-sm">
                  <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Call
                </a>
                <a href={`sms:${candidate.phone}`} className="btn btn-secondary btn-sm">
                  <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                  SMS
                </a>
              </>
            )}
            <button 
              onClick={() => handleEnrich('serp')} 
              className="btn btn-secondary btn-sm"
              disabled={isEnriching}
            >
              {isEnriching ? (
                <span className="w-3.5 h-3.5 border-2 border-text-secondary border-t-accent rounded-full animate-spin"></span>
              ) : (
                <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />
              )}
              {isEnriching ? 'Searching Web...' : 'Web Search'}
            </button>
            <button onClick={() => setShowEditModal(true)} className="btn btn-secondary btn-sm">
              <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              Edit
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditCandidateModal
          candidate={candidate}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            fetchDatabase(); // Refresh the global store
          }}
        />
      )}

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
                {candidate.skills.map((skill: string) => (
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
