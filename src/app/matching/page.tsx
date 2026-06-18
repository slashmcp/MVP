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
  Loader2
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { statusColors } from '@/lib/mock-data';
import type { MatchResult } from '@/lib/schemas';

type ViewMode = 'all' | 'by-job' | 'by-candidate';

export default function MatchingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const { dbJobs, dbCandidates, showCredentialPrompt } = useAppStore();
  const mockJobs = dbJobs || [];
  const mockCandidates = dbCandidates || [];

  const handleRunMatching = async () => {
    // If not configured, show prompt but we can still run it for mock results
    // Wait, the prompt will halt execution unless we dismiss it, 
    // but the backend handles unconfigured openai by returning a mock score.
    // For MVP, we will run the matching for the selected items to save time.
    setIsMatching(true);
    setMatchResults([]);
    
    let candidatesToMatch = mockCandidates.filter(c => c.status !== 'Placed' && c.status !== 'Rejected');
    let jobsToMatch = mockJobs.filter(j => j.status !== 'Filled');

    // Limit matching batch based on view mode to save time/API calls
    if (viewMode === 'by-job' && selectedJob) {
      jobsToMatch = jobsToMatch.filter(j => j.id === selectedJob);
    } else if (viewMode === 'by-candidate' && selectedCandidate) {
      candidatesToMatch = candidatesToMatch.filter(c => c.id === selectedCandidate);
    } else {
      // In "All" view, just run a small batch (top 3 cands x top 2 jobs)
      candidatesToMatch = candidatesToMatch.slice(0, 3);
      jobsToMatch = jobsToMatch.slice(0, 2);
    }

    const newResults: MatchResult[] = [];

    for (const job of jobsToMatch) {
      for (const cand of candidatesToMatch) {
        try {
          const res = await fetch('/api/ai/match-candidates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidate: {
                name: cand.name,
                location: cand.location,
                skills: cand.skills || [],
                seniority: cand.seniority,
                notes: cand.notes
              },
              job: {
                title: job.title,
                client: job.client,
                location: job.location,
                requirements: job.requirements
              }
            })
          });
          
          if (res.ok) {
            const data = await res.json();
            
            // If the user doesn't have an API key, we should prompt them
            if (data.source === 'mock' && newResults.length === 0) {
              showCredentialPrompt({ service: 'openai', feature: 'Real AI Matching' });
            }

            newResults.push({
              candidateId: cand.id,
              candidateName: cand.name,
              jobId: job.id,
              jobTitle: job.title,
              fitScore: data.fitScore,
              reasoning: data.reasoning,
              strengths: data.strengths || [],
              gaps: data.gaps || [],
            });
          }
        } catch (error) {
          console.error("Match error", error);
        }
      }
    }

    setMatchResults(newResults);
    setIsMatching(false);
  };

  const filteredResults = matchResults.filter((r) => {
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
          onClick={handleRunMatching}
          disabled={isMatching}
        >
          {isMatching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
          ) : (
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
          )}
          {isMatching ? 'Analyzing...' : 'Run Matching'}
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
              onClick={() => {
                setViewMode(key);
                if (key === 'all') {
                  setSelectedJob(null);
                  setSelectedCandidate(null);
                }
              }}
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
        {matchResults.length === 0 && !isMatching && (
          <div className="text-center py-12 text-text-secondary bg-surface border border-border border-dashed rounded-lg">
            No matches generated yet. Click "Run Matching" to analyze profiles.
          </div>
        )}
        
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
                    <Link href={`/candidates/${match.candidateId}`} className="text-lg font-semibold text-text-primary hover:text-accent transition-colors">
                      {match.candidateName}
                    </Link>
                    <ArrowRight className="w-4 h-4 text-text-tertiary mx-1" />
                    <Link href={`/jobs/${match.jobId}`} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                      {match.jobTitle}
                    </Link>
                  </div>
                  
                  <p className="text-sm text-text-secondary mb-4 leading-relaxed max-w-3xl">
                    <Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 text-accent opacity-70 align-text-bottom" />
                    {match.reasoning}
                  </p>

                  <div className="flex flex-wrap gap-x-8 gap-y-4">
                    {/* Strengths */}
                    {match.strengths.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-success mb-2 block">Key Strengths</span>
                        <div className="flex flex-wrap gap-1.5">
                          {match.strengths.map((s: string) => (
                            <span key={s} className="badge badge-green text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Gaps */}
                    {match.gaps.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-error mb-2 block">Potential Gaps</span>
                        <div className="flex flex-wrap gap-1.5">
                          {match.gaps.map((g: string) => (
                            <span key={g} className="badge badge-red text-xs">{g}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0 border-l border-border pl-5">
                  <button className="btn btn-primary btn-sm w-full">
                    <Mail className="w-3.5 h-3.5" />
                    Reach Out
                  </button>
                  <Link href={`/candidates/${match.candidateId}`} className="btn btn-secondary btn-sm w-full">
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
