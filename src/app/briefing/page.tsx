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
  Target,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

const briefingData = {
  date: new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }),
  priorityCandidates: [
    {
      name: 'Sarah Chen',
      id: 'c1',
      reason: 'Engaged candidate — 2 days since last contact. High match (88%) for TechVentures Full-Stack role.',
      priority: 'high' as const,
      action: 'Schedule interview availability call',
    },
    {
      name: 'Marcus Johnson',
      id: 'c2',
      reason: 'Interview stage — DataFlow ML Engineer. Interview prep materials needed.',
      priority: 'high' as const,
      action: 'Send interview prep email',
    },
    {
      name: 'Emily Rodriguez',
      id: 'c3',
      reason: 'Submitted to CloudScale 3 days ago. No feedback yet from client.',
      priority: 'high' as const,
      action: 'Follow up with CloudScale for feedback',
    },
    {
      name: 'Aisha Patel',
      id: 'c5',
      reason: 'New referral from Marcus Johnson. Strong DevOps profile matches FinanceCore opening.',
      priority: 'medium' as const,
      action: 'Initial outreach — introduce DevOps Lead opportunity',
    },
  ],
  clientFollowUps: [
    {
      company: 'CloudScale Solutions',
      id: 'cl3',
      reason: 'Weekly update due. Emily Rodriguez submission pending feedback. Present David Kim as additional candidate.',
      action: 'Schedule check-in call',
    },
    {
      company: 'MedTech Innovations',
      id: 'cl5',
      reason: 'Prospect client — posted 3 engineering roles on LinkedIn. High conversion potential.',
      action: 'Send introductory email',
    },
  ],
  hotJobs: [
    {
      title: 'Staff Backend Engineer',
      id: 'j3',
      client: 'CloudScale Solutions',
      reason: 'New posting — $200k-$260k. David Kim is a 92% match.',
      urgency: 'New',
    },
    {
      title: 'Data Engineer',
      id: 'j6',
      client: 'DataFlow Analytics',
      reason: 'New posting — remote. Priya Sharma is a strong fit.',
      urgency: 'New',
    },
  ],
  stalePipeline: [
    {
      name: 'James Park',
      id: 'c4',
      stage: 'Contacted',
      daysSinceUpdate: 6,
      suggestion: 'No response to initial outreach. Try LinkedIn message or phone call.',
    },
    {
      name: 'Tom Bradley',
      id: 'c10',
      stage: 'Contacted',
      daysSinceUpdate: 5,
      suggestion: 'Salesforce architect — match to upcoming FinanceCore CRM project.',
    },
  ],
  suggestedActions: [
    'Submit David Kim to CloudScale for Staff Backend Engineer role (92% match)',
    'Send Priya Sharma profile to DataFlow for Data Engineer position',
    'Schedule MedTech Innovations intro call to convert from Prospect to Active client',
    'Re-engage James Park via LinkedIn or phone — initial email unanswered',
    'Prepare weekly placement report for internal review',
  ],
};

const priorityConfig = {
  high: { color: 'text-danger', bg: 'bg-danger-soft', dot: 'bg-danger' },
  medium: { color: 'text-warning', bg: 'bg-warning-soft', dot: 'bg-warning' },
  low: { color: 'text-text-secondary', bg: 'bg-[var(--surface-elevated)]', dot: 'bg-text-tertiary' },
};

export default function BriefingPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-accent" strokeWidth={1.75} />
            <h1 className="text-2xl font-semibold text-text-primary">Daily Briefing</h1>
          </div>
          <p className="text-sm text-text-secondary">{briefingData.date}</p>
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
          <span className="text-xs text-text-tertiary">{briefingData.priorityCandidates.length} actions</span>
        </div>
        <div className="divide-y divide-border">
          {briefingData.priorityCandidates.map((c) => {
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
          })}
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
          {briefingData.clientFollowUps.map((c) => (
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
          ))}
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
            {briefingData.hotJobs.map((j) => (
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
            ))}
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
            {briefingData.stalePipeline.map((s) => (
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
            ))}
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
            {briefingData.suggestedActions.map((action, i) => (
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
