'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  Send,
  Save,
  RefreshCw,
  Sparkles,
  Clock,
  ChevronDown,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
// No mock data needed

const templates = [
  { id: 'outreach', label: 'Initial Outreach', icon: Mail },
  { id: 'followup', label: 'Follow-up', icon: RefreshCw },
  { id: 'interview', label: 'Interview Invitation', icon: CheckCircle },
  { id: 'client', label: 'Client Update', icon: Send },
];

const mockEmailDraft = `Hi Sarah,

I hope this message finds you well. I came across your profile and was really impressed by your experience with React and Node.js.

I'm currently working with a fast-growing Series C startup (TechVentures Inc.) that's looking for a Senior Full-Stack Engineer. The role offers:

• $160k–$200k base salary
• Remote-friendly (San Francisco HQ)
• Strong engineering culture with modern tech stack
• Equity package included

Based on your background, I think you'd be an excellent fit. Would you be open to a brief 15-minute call this week to discuss the opportunity?

Looking forward to hearing from you.

Best regards,
[Your Name]
Recruitment Consultant`;

const mockCommHistory: any[] = [];

const statusBadge: Record<string, string> = {
  Draft: 'badge-neutral',
  Sent: 'badge-blue',
  Opened: 'badge-amber',
  Replied: 'badge-green',
};

export function OutreachPageContent() {
  const searchParams = useSearchParams();
  const initialCandidate = searchParams.get('candidate');
  
  const [selectedTemplate, setSelectedTemplate] = useState('outreach');
  const [selectedCandidate, setSelectedCandidate] = useState(initialCandidate || '');
  const [emailBody, setEmailBody] = useState(mockEmailDraft);
  const [subject, setSubject] = useState('Exciting Senior Full-Stack Opportunity at TechVentures');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { showCredentialPrompt, dbCandidates, addToast } = useAppStore();
  const cands = dbCandidates || [];

  useEffect(() => {
    if (cands.length > 0 && !selectedCandidate) {
      setSelectedCandidate(cands[0].id);
    }
  }, [cands, selectedCandidate]);

  const candidate = cands.find((c) => c.id === selectedCandidate);

  const handleSendEmail = async (isDraft: boolean = false) => {
    if (!candidate) {
      addToast({ type: 'error', message: 'Please select a recipient' });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: candidate.email,
          subject,
          bodyText: emailBody,
          isDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');

      addToast({
        type: 'success',
        message: data.message || (isDraft ? 'Draft saved successfully' : 'Email sent successfully'),
      });
    } catch (e: any) {
      addToast({ type: 'error', message: e.message || 'An error occurred' });
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerate = () => {
    showCredentialPrompt({
      service: 'anthropic',
      feature: 'AI Email Generation'
    });
    // Still mock it in the background for demo purposes
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Outreach</h1>
        <p className="text-sm text-text-secondary mt-1">
          AI-powered email composer and communication tracking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Composer */}
        <div className="lg:col-span-2 space-y-4">
          {/* Template selector */}
          <div className="flex gap-2 flex-wrap">
            {templates.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`btn-sm rounded-md flex items-center gap-1.5 text-xs font-medium transition-all ${
                    selectedTemplate === t.id
                      ? 'bg-accent-soft text-accent border border-accent/20'
                      : 'btn btn-secondary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b border-border space-y-3">
              {/* To field */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-text-secondary w-12">To</label>
                <select
                  value={selectedCandidate}
                  onChange={(e) => setSelectedCandidate(e.target.value)}
                  className="input flex-1"
                  id="outreach-recipient"
                >
                  {cands.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-text-secondary w-12">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input flex-1"
                  id="outreach-subject"
                />
              </div>
            </div>

            {/* Email body */}
            <div className="px-5 py-4">
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full min-h-[320px] text-sm text-text-primary bg-transparent border-none outline-none resize-none leading-relaxed"
                placeholder="Compose your email..."
                id="outreach-body"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn btn-secondary btn-sm"
                id="ai-generate-btn"
              >
                {isGenerating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                )}
                {isGenerating ? 'Generating...' : 'AI Generate'}
              </button>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  className="btn btn-secondary btn-sm flex-1 sm:flex-none"
                  onClick={() => handleSendEmail(true)}
                  disabled={isSending}
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" strokeWidth={1.75} />}
                  Save Draft
                </button>
                <button 
                  className="btn btn-primary btn-sm flex-1 sm:flex-none"
                  onClick={() => handleSendEmail(false)}
                  disabled={isSending}
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" strokeWidth={1.75} />}
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Communication History */}
        <div className="card h-fit">
          <div className="card-header">
            <h2 className="text-base font-semibold text-text-primary">Recent Communications</h2>
          </div>
          <div className="divide-y divide-border">
            {mockCommHistory.length > 0 ? (
              mockCommHistory.map((comm) => (
                <div
                  key={comm.id}
                  className="px-5 py-3.5 hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      href={`/${comm.entityType}s/${comm.entityId}`}
                      className="text-sm font-medium text-text-primary hover:text-accent transition-colors"
                    >
                      {comm.to}
                    </Link>
                    <span className={`badge text-[10px] ${statusBadge[comm.status]}`}>
                      {comm.status}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate">{comm.subject}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-text-tertiary">
                    <Clock className="w-3 h-3" strokeWidth={1.75} />
                    {new Date(comm.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    <span className="badge badge-neutral text-[9px] px-1.5 py-0">{comm.type}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center flex flex-col items-center justify-center text-text-tertiary h-full">
                <Mail className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium text-text-secondary">No recent communications</p>
                <p className="text-xs mt-1">Sent emails will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OutreachPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /></div>}>
      <OutreachPageContent />
    </Suspense>
  );
}
