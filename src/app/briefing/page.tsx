'use client';

import {
  Zap,
  Users,
  Building2,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Send,
  Clock,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/store/app-store';

const priorityConfig = {
  high: { color: 'text-danger', bg: 'bg-danger-soft', dot: 'bg-danger' },
  medium: { color: 'text-warning', bg: 'bg-warning-soft', dot: 'bg-warning' },
  low: { color: 'text-text-secondary', bg: 'bg-[var(--surface-elevated)]', dot: 'bg-text-tertiary' },
};

export default function BriefingPage() {
  const { dbCandidates, dbJobs, dbClients, isDbLoading } = useAppStore();

  if (isDbLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const candidates = dbCandidates || [];
  const jobs = dbJobs || [];
  const clients = dbClients || [];

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // 1. Priority Candidates: Sort by rating (highest first), then status
  const sortedCandidates = [...candidates].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const priorityCandidates = sortedCandidates.slice(0, 4).map((c) => {
    const priority = c.rating >= 4 ? ('high' as const) : ('medium' as const);
    let action = 'Reach out for check-in';
    let reason = `${c.role || 'Software Engineer'} based in ${c.location || 'Unknown Location'}. Matches candidate criteria.`;
    
    if (c.status === 'New') {
      action = 'Send initial outreach email';
      reason = `Highly rated (${c.rating || 3}/5) candidate recently added. Ready for initial screening.`;
    } else if (c.status === 'Interviewing') {
      action = 'Prepare candidate for upcoming interview';
      reason = `In active interview pipeline. Needs interview prep alignment.`;
    } else if (c.status === 'Applied') {
      action = 'Follow up with client on application';
      reason = `Application submitted. Awaiting feedback from employer.`;
    } else if (c.status === 'Offered') {
      action = 'Assist with offer negotiation';
      reason = `Offer extended! Needs support during closing stage.`;
    }

    return {
      name: c.name,
      id: c.id,
      reason,
      priority,
      action,
    };
  });

  // 2. Client Follow-ups: Prospect clients first, then active clients with open roles
  const prospectClients = clients.filter(cl => cl.status === 'Prospect');
  const activeClients = clients.filter(cl => cl.status !== 'Prospect');
  const followUpClients = [...prospectClients, ...activeClients].slice(0, 3);
  const clientFollowUps = followUpClients.map((cl) => {
    let action = 'Schedule check-in call';
    let reason = `${cl.companyName} is an active client in ${cl.location || 'Unknown'}.`;
    
    if (cl.status === 'Prospect') {
      action = 'Send introductory outreach email';
      reason = `Target account with high potential. Needs initial contact to explore staffing needs.`;
    } else if (cl.openRoles > 0) {
      action = 'Present matching candidates';
      reason = `Has ${cl.openRoles} active open positions. Awaiting candidate profiles.`;
    } else {
      action = 'Check-in on hiring plan';
      reason = `No active roles currently open. Follow up on upcoming pipeline requirements.`;
    }

    return {
      company: cl.companyName,
      id: cl.id,
      reason,
      action,
    };
  });

  // 3. Hot Jobs: Open jobs, with urgency calculated
  const openJobs = jobs.filter(j => j.status === 'Open');
  const hotJobs = openJobs.slice(0, 3).map(j => {
    let urgency = 'New';
    if (j.priority === 'High') urgency = 'Urgent';
    
    // Attempt to find a candidate matching the job
    const match = candidates.find(c => {
      const jobTitleWords = j.title.toLowerCase().split(/\s+/);
      const candRole = (c.role || '').toLowerCase();
      return jobTitleWords.some((word: string) => word.length > 3 && candRole.includes(word));
    });

    const reason = match 
      ? `Active matching candidate: ${match.name} (${match.role || 'Developer'}).`
      : `High priority search. Sourcing active candidates matching requirements.`;

    return {
      title: j.title,
      id: j.id,
      client: j.client,
      reason,
      urgency,
    };
  });

  // 4. Stale Pipeline: Candidates who are Contacted or Applied
  const contactedCands = candidates.filter(c => c.status === 'Contacted' || c.status === 'Applied').slice(0, 3);
  const fallbackStale = candidates.slice(0, 2);
  const finalStale = contactedCands.length > 0 ? contactedCands : fallbackStale;
  const stalePipeline = finalStale.map((s, i) => {
    let daysSinceUpdate = 5 + (i * 2);
    if (s.lastContact) {
      const diffTime = Math.abs(new Date().getTime() - new Date(s.lastContact).getTime());
      daysSinceUpdate = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    let suggestion = 'Follow up via email or LinkedIn';
    if (s.status === 'Contacted') {
      suggestion = `Awaiting response to initial outreach. Attempt follow-up message.`;
    } else if (s.status === 'Applied') {
      suggestion = `Submitted to client. Ping hiring manager for feedback.`;
    }

    return {
      name: s.name,
      id: s.id,
      stage: s.status || 'New',
      daysSinceUpdate,
      suggestion,
    };
  });

  // 5. Suggested Actions: Dynamically matching candidates to jobs
  const suggestedActions: string[] = [];
  
  // Job matches
  jobs.slice(0, 2).forEach(j => {
    const match = candidates.find(c => {
      const jobTitleWords = j.title.toLowerCase().split(/\s+/);
      const candRole = (c.role || '').toLowerCase();
      return jobTitleWords.some((word: string) => word.length > 3 && candRole.includes(word));
    });
    if (match) {
      suggestedActions.push(`Submit ${match.name} to ${j.client} for the open ${j.title} position.`);
    }
  });

  // Prospect outreaches
  clients.filter(cl => cl.status === 'Prospect').slice(0, 2).forEach(cl => {
    suggestedActions.push(`Conduct introductory cold outreach campaign for ${cl.companyName}.`);
  });

  // Interview preparation
  candidates.filter(c => c.status === 'Interviewing').slice(0, 2).forEach(c => {
    suggestedActions.push(`Send interview prep resources to ${c.name} for their upcoming round.`);
  });

  // Fallbacks if not enough suggestions
  if (suggestedActions.length < 3) {
    suggestedActions.push('Review newly scraped companies from market scraper.');
    suggestedActions.push('Sync local placements data to the tracking sheet.');
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-accent" strokeWidth={1.75} />
            <h1 className="text-2xl font-semibold text-text-primary">Daily Briefing</h1>
          </div>
          <p className="text-sm text-text-secondary">{dateStr}</p>
        </div>
        <button className="btn btn-secondary btn-sm" id="send-briefing-btn">
          <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
          Send to Outlook
        </button>
      </div>

      {/* Priority Candidates */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" strokeWidth={1.75} />
            <h2 className="text-base font-semibold text-text-primary">Priority Candidates</h2>
          </div>
          <span className="text-xs text-text-tertiary">{priorityCandidates.length} actions</span>
        </div>
        <div className="divide-y divide-border">
          {priorityCandidates.length > 0 ? (
            priorityCandidates.map((c) => {
              const priority = priorityConfig[c.priority];
              return (
                <div key={c.id} className="px-5 py-4 group hover:bg-[var(--surface-elevated)] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${priority.dot}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/candidates/${c.id}`}
                          className="text-sm font-semibold text-text-primary hover:text-accent transition-colors"
                        >
                          {c.name}
                        </Link>
                        <span className={`badge ${priority.bg} ${priority.color} text-[10px]`}>
                          {c.priority}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">{c.reason}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs font-medium text-accent">
                        <Lightbulb className="w-3 h-3" strokeWidth={1.75} />
                        {c.action}
                      </div>
                    </div>
                    <Link
                      href={`/candidates/${c.id}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent-soft"
                    >
                      <ChevronRight className="w-4 h-4 text-accent" strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-sm text-text-tertiary text-center">No priority candidates found.</div>
          )}
        </div>
      </div>

      {/* Client Follow-ups */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-accent" strokeWidth={1.75} />
            <h2 className="text-base font-semibold text-text-primary">Client Follow-ups</h2>
          </div>
        </div>
        <div className="divide-y divide-border">
          {clientFollowUps.length > 0 ? (
            clientFollowUps.map((c) => (
              <div key={c.id} className="px-5 py-4 group hover:bg-[var(--surface-elevated)] transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/clients/${c.id}`}
                      className="text-sm font-semibold text-text-primary hover:text-accent transition-colors"
                    >
                      {c.company}
                    </Link>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{c.reason}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-accent">
                      <Lightbulb className="w-3 h-3" strokeWidth={1.75} />
                      {c.action}
                    </div>
                  </div>
                  <Link
                    href={`/clients/${c.id}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent-soft"
                  >
                    <ChevronRight className="w-4 h-4 text-accent" strokeWidth={1.75} />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-sm text-text-tertiary text-center">No client records found.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hot Jobs */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" strokeWidth={1.75} />
              <h2 className="text-base font-semibold text-text-primary">Hot Jobs</h2>
            </div>
          </div>
          <div className="divide-y divide-border">
            {hotJobs.length > 0 ? (
              hotJobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/jobs/${j.id}`}
                  className="block px-5 py-3.5 hover:bg-[var(--surface-elevated)] transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                      {j.title}
                    </span>
                    <span className="badge badge-green text-[10px]">{j.urgency}</span>
                  </div>
                  <p className="text-xs text-text-secondary">{j.client}</p>
                  <p className="text-xs text-text-tertiary mt-1">{j.reason}</p>
                </Link>
              ))
            ) : (
              <div className="p-6 text-sm text-text-tertiary text-center">No open jobs found.</div>
            )}
          </div>
        </div>

        {/* Stale Pipeline */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" strokeWidth={1.75} />
              <h2 className="text-base font-semibold text-text-primary">Stale Pipeline</h2>
            </div>
          </div>
          <div className="divide-y divide-border">
            {stalePipeline.length > 0 ? (
              stalePipeline.map((s) => (
                <Link
                  key={s.id}
                  href={`/candidates/${s.id}`}
                  className="block px-5 py-3.5 hover:bg-[var(--surface-elevated)] transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                      {s.name}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-warning">
                      <Clock className="w-3 h-3" strokeWidth={1.75} />
                      {s.daysSinceUpdate}d in {s.stage}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary">{s.suggestion}</p>
                </Link>
              ))
            ) : (
              <div className="p-6 text-sm text-text-tertiary text-center">No candidates in progress.</div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Actions */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" strokeWidth={1.75} />
            <h2 className="text-base font-semibold text-text-primary">AI Suggested Actions</h2>
          </div>
        </div>
        <div className="card-body">
          <ol className="space-y-3">
            {suggestedActions.map((action, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-soft text-accent text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-text-secondary leading-relaxed">{action}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
