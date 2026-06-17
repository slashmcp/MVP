'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Target,
  ArrowRight,
  Users,
  Briefcase,
  ChevronRight,
  Sparkles,
  Mail,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { mockCandidates, mockJobs, statusColors } from '@/lib/mock-data';
import type { MatchResult } from '@/lib/schemas';

// Mock match results
const mockMatchResults: MatchResult[] = [
  {
    candidateId: 'c_101',
    candidateName: 'Rob Hedley',
    jobId: 'j_01',
    jobTitle: 'Senior Frontend Developer (React + UX/UI)',
    fitScore: 94,
    reasoning: 'Extensive React experience, SC cleared, and local to Surrey. Excellent fit for Safe Software frontend modernization.',
    strengths: ['React expertise', 'Surrey local', 'SC Cleared', 'Senior level'],
    gaps: ['UX/UI depth unclear'],
  },
  {
    candidateId: 'c_bulk_17_1781737310929',
    candidateName: 'Harikrishnan K S',
    jobId: 'j_02',
    jobTitle: 'AI/ML Software Engineer (C++)',
    fitScore: 89,
    reasoning: "Strong Machine Learning background. Matches Creativity Software's requirement for AI/ML expertise.",
    strengths: ['Machine Learning', 'Data Science', 'Senior level'],
    gaps: ['C++ depth unclear'],
  },
  {
    candidateId: 'c_102',
    candidateName: 'Reim Ryad',
    jobId: 'j_01',
    jobTitle: 'Senior Frontend Developer (React + UX/UI)',
    fitScore: 82,
    reasoning: 'Solid React developer. Needs to be vetted for senior-level system design skills and UX/UI crossover.',
    strengths: ['React', 'JavaScript', 'Active candidate'],
    gaps: ['May not be senior enough', 'No SC clearance mentioned'],
  },
  {
    candidateId: 'c_bulk_11_1781737310929',
    candidateName: 'Marco Volino',
    jobId: 'j_02',
    jobTitle: 'AI/ML Software Engineer (C++)',
    fitScore: 88,
    reasoning: 'University of Surrey Senior Lecturer. Deep academic background in ML and algorithms. Excellent for Creativity Software R&D.',
    strengths: ['Algorithm Optimization', 'Deep academic ML background', 'Surrey local'],
    gaps: ['Transition from academia to industry'],
  },
  {
    candidateId: 'c_103',
    candidateName: 'Igor Zaytsev',
    jobId: 'j_01',
    jobTitle: 'Senior Frontend Developer (React + UX/UI)',
    fitScore: 78,
    reasoning: 'Front-end React developer with solid fundamental skills. Good backup option for Safe Software.',
    strengths: ['React', 'Web Development'],
    gaps: ['No specific UX/UI design experience'],
  },
];

type ViewMode = 'all' | 'by-job' | 'by-candidate';

export default function MatchingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  const { showCredentialPrompt } = useAppStore();

  const filteredResults = mockMatchResults.filter((r) => {
    if (viewMode === 'by-job' && selectedJob) return r.jobId === selectedJob;
    if (viewMode === 'by-candidate' && selectedCandidate) return r.candidateId === selectedCandidate;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Matching Engine</h1>
          <p className="text-sm text-text-secondary mt-1">
            AI-powered candidate ↔ job matching with fit scores
          </p>
        </div>
        <button 
          className="btn btn-primary btn-sm" 
          id="run-matching-btn"
          onClick={() => showCredentialPrompt({ service: 'openai', feature: 'Run AI Matching' })}
        >
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
          Run Matching
        </button>
      </div>

      {/* View mode toggle + filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-elevated)] border border-border">
          {([
            { key: 'all', label: 'All Matches', icon: Target },
            { key: 'by-job', label: 'By Job', icon: Briefcase },
            { key: 'by-candidate', label: 'By Candidate', icon: Users },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`btn-xs rounded-md px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
                viewMode === key
                  ? 'bg-surface text-text-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>

        {viewMode === 'by-job' && (
          <select
            value={selectedJob || ''}
            onChange={(e) => setSelectedJob(e.target.value || null)}
            className="input max-w-xs"
          >
            <option value="">Select a job...</option>
            {mockJobs.filter((j) => j.status !== 'Filled').map((j) => (
              <option key={j.id} value={j.id}>{j.title} — {j.client}</option>
            ))}
          </select>
        )}

        {viewMode === 'by-candidate' && (
          <select
            value={selectedCandidate || ''}
            onChange={(e) => setSelectedCandidate(e.target.value || null)}
            className="input max-w-xs"
          >
            <option value="">Select a candidate...</option>
            {mockCandidates.filter((c) => c.status !== 'Placed' && c.status !== 'Rejected').map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Match Cards */}
      <div className="space-y-4">
        {filteredResults
          .sort((a, b) => b.fitScore - a.fitScore)
          .map((match) => (
            <div key={`${match.candidateId}-${match.jobId}`} className="card p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-5">
                {/* Score */}
                <div
                  className={`score-badge w-14 h-14 text-base flex-shrink-0 ${
                    match.fitScore >= 80
                      ? 'score-high'
                      : match.fitScore >= 60
                      ? 'score-medium'
                      : 'score-low'
                  }`}
                >
                  {match.fitScore}
                </div>

                {/* Match details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/candidates/${match.candidateId}`}
                      className="text-sm font-semibold text-text-primary hover:text-accent transition-colors"
                    >
                      {match.candidateName}
                    </Link>
                    <ArrowRight className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={1.75} />
                    <Link
                      href={`/jobs/${match.jobId}`}
                      className="text-sm font-semibold text-text-primary hover:text-accent transition-colors"
                    >
                      {match.jobTitle}
                    </Link>
                  </div>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">{match.reasoning}</p>

                  <div className="flex gap-6 mt-3">
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-success">Strengths</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.strengths.map((s) => (
                          <span key={s} className="badge badge-green text-[10px]">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-warning">Gaps</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.gaps.map((g) => (
                          <span key={g} className="badge badge-amber text-[10px]">{g}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link
                    href={`/outreach?candidate=${match.candidateId}`}
                    className="btn btn-secondary btn-xs"
                  >
                    <Mail className="w-3 h-3" strokeWidth={1.75} />
                    Outreach
                  </Link>
                  <Link
                    href={`/candidates/${match.candidateId}`}
                    className="btn btn-ghost btn-xs"
                  >
                    Profile
                    <ChevronRight className="w-3 h-3" strokeWidth={1.75} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
      </div>

      {filteredResults.length === 0 && (
        <div className="empty-state">
          <Target className="w-10 h-10 mb-3 text-text-tertiary" strokeWidth={1.25} />
          <p className="text-sm font-medium">No matches found</p>
          <p className="text-xs mt-1">Select a job or candidate to see AI-powered matches.</p>
        </div>
      )}
    </div>
  );
}
