'use client';

import { useState } from 'react';
import { X, Mail, Loader2, ExternalLink, Sparkles, Copy, Check } from 'lucide-react';

import { useAppStore } from '@/store/app-store';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CandidateData {
  id?: string;
  name: string;
  email?: string;
  role?: string;
  company?: string;
  skills?: string[];
  notes?: string;
  seniority?: string;
  linkedinUrl?: string;
}

interface ClientData {
  id?: string;
  name?: string;
  companyName?: string;
  contactPerson?: string;
  contactEmail?: string;
  email?: string;
  openRoles?: string | number;
  industry?: string;
  notes?: string;
  linkedinUrl?: string;
}

interface EmailDraftModalProps {
  type: 'candidate' | 'client';
  data: CandidateData | ClientData;
  onClose: () => void;
}

// ─── Template Configs ─────────────────────────────────────────────────────────

const CANDIDATE_TEMPLATES = [
  { key: 'intro',      label: 'Intro Outreach',  desc: 'First contact' },
  { key: 'follow-up',  label: 'Follow Up',        desc: 'No reply yet' },
  { key: 'interview',  label: 'Interview Invite', desc: 'Invite to interview' },
  { key: 'shortlist',  label: 'Shortlisted',      desc: 'You\'ve been shortlisted' },
];

const CLIENT_TEMPLATES = [
  { key: 'biz-dev',          label: 'Business Dev',       desc: 'Cold outreach' },
  { key: 'check-in',         label: 'Check-In',           desc: 'Existing client' },
  { key: 'submit-candidate', label: 'Submit Candidate',   desc: 'Send a candidate' },
  { key: 'role-brief',       label: 'Request Role Brief', desc: 'Get job spec' },
];

// ─── Channel Tabs ─────────────────────────────────────────────────────────────

type Channel = 'email' | 'linkedin-message' | 'linkedin-inmail';

const CHANNELS: { key: Channel; label: string; icon: React.ReactNode; hint: string }[] = [
  {
    key: 'email',
    label: 'Email',
    hint: 'Opens in Outlook or Gmail',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>
    ),
  },
  {
    key: 'linkedin-message',
    label: 'LI Connection',
    hint: '≤300 chars · copy & paste',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    key: 'linkedin-inmail',
    label: 'LI InMail',
    hint: 'With subject · copy & paste',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildOutlookUrl(to: string, subject: string, body: string) {
  const params = new URLSearchParams({ to, subject, body });
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
}

function buildGmailUrl(to: string, subject: string, body: string) {
  const params = new URLSearchParams({ view: 'cm', to, su: subject, body });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function buildMailtoUrl(to: string, subject: string, body: string) {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function ensureAbsoluteUrl(url?: string) {
  if (!url) return '';
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmailDraftModal({ type, data, onClose }: EmailDraftModalProps) {
  const { isDemoMode } = useAppStore();
  const templates = type === 'candidate' ? CANDIDATE_TEMPLATES : CLIENT_TEMPLATES;
  const [channel, setChannel] = useState<Channel>('email');
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].key);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [copied, setCopied] = useState(false);

  const toEmail = type === 'candidate'
    ? (data as CandidateData).email || ''
    : (data as ClientData).contactEmail || (data as ClientData).email || '';

  const displayName = type === 'candidate'
    ? (data as CandidateData).name
    : (data as ClientData).contactPerson || (data as ClientData).companyName || '';

  const linkedinUrl = (data as CandidateData | ClientData).linkedinUrl;
  const isLinkedIn = channel !== 'email';
  const isConnectionRequest = channel === 'linkedin-message';

  const charCount = body.length;
  const charLimit = isConnectionRequest ? 300 : 400;
  const overLimit = isConnectionRequest && charCount > 300;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setHasDraft(false);
    setSubject('');
    setBody('');

    try {
      let payload: Record<string, unknown> = { type, template: selectedTemplate, channel };

      if (type === 'candidate') {
        const c = data as CandidateData;
        payload = { ...payload, name: c.name, email: c.email, role: c.role, company: c.company, skills: c.skills, notes: c.notes };
      } else {
        const cl = data as ClientData;
        payload = { ...payload, name: cl.contactPerson || cl.name, email: cl.contactEmail || cl.email, company: cl.companyName };
      }

      const res = await fetch('/api/email/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        setSubject(result.subject || '');
        setBody(result.body || '');
        setHasDraft(true);
      } else {
        alert(result.error || 'Failed to generate draft');
      }
    } catch {
      alert('Network error generating draft');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    const text = isLinkedIn
      ? (subject ? `Subject: ${subject}\n\n${body}` : body)
      : `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset draft when channel or template changes
  const selectChannel = (ch: Channel) => { setChannel(ch); setHasDraft(false); setSubject(''); setBody(''); };
  const selectTemplate = (t: string) => { setSelectedTemplate(t); setHasDraft(false); setSubject(''); setBody(''); };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg bg-[var(--surface)] border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">AI Outreach Draft</h2>
              <p className="text-xs text-text-tertiary mt-0.5">
                {displayName}{toEmail && !isLinkedIn ? ` · ${toEmail}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] text-text-tertiary hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Channel Tabs */}
          <div>
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 block">Channel</label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {CHANNELS.map((ch, i) => (
                <button
                  key={ch.key}
                  onClick={() => selectChannel(ch.key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 text-xs font-medium transition-all border-r border-border last:border-r-0 ${
                    channel === ch.key
                      ? ch.key === 'email'
                        ? 'bg-accent text-white'
                        : 'bg-[#0a66c2] text-white'
                      : 'bg-[var(--surface-elevated)] text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span className={channel === ch.key ? 'opacity-100' : 'opacity-60'}>{ch.icon}</span>
                  <span>{ch.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-text-tertiary mt-1.5 text-center">
              {CHANNELS.find(c => c.key === channel)?.hint}
            </p>
          </div>

          {/* Template Picker */}
          <div>
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 block">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.key}
                  onClick={() => selectTemplate(t.key)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    selectedTemplate === t.key
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-[var(--surface-elevated)] text-text-secondary hover:border-accent/50 hover:text-text-primary'
                  }`}
                >
                  <div className="font-medium text-xs">{t.label}</div>
                  <div className="text-[11px] opacity-70 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Drafting with AI…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {hasDraft ? 'Regenerate' : 'Generate Draft'}</>
            )}
          </button>

          {/* Draft Editor */}
          {hasDraft && (
            <div className="space-y-3 animate-fade-in">

              {/* Subject (email or InMail) */}
              {(channel === 'email' || channel === 'linkedin-inmail') && subject && (
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1.5 block">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              )}

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Message</label>
                  {isLinkedIn && (
                    <span className={`text-xs font-mono ${overLimit ? 'text-red-400' : charCount > charLimit * 0.85 ? 'text-yellow-400' : 'text-text-tertiary'}`}>
                      {charCount}/{charLimit}
                    </span>
                  )}
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={isConnectionRequest ? 4 : 6}
                  className={`w-full px-3 py-2 bg-[var(--surface-elevated)] border rounded-lg text-sm text-text-primary focus:outline-none transition-colors resize-none leading-relaxed ${
                    overLimit ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-accent'
                  }`}
                />
                {overLimit && (
                  <p className="text-xs text-red-400 mt-1">Connection requests must be under 300 characters. Trim the message above.</p>
                )}
              </div>

              {/* Action Buttons */}
              {channel === 'email' ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Outlook */}
                  <button
                    onClick={() => {
                      if (isDemoMode) {
                        alert('Please sign in with your workspace account to send emails.');
                        window.location.href = '/login';
                        return;
                      }
                      window.open(buildOutlookUrl(toEmail, subject, body), '_blank');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0078d4] hover:bg-[#006cbd] text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 7.387v10.478L19.2 21V15l-2.4 2.25V21L12 19.2l-4.8 1.8v-3.75L4.8 15v6L0 17.865V7.387L12 3l12 4.387zM7.2 14.25L12 16.5l4.8-2.25V9.75L12 7.5 7.2 9.75v4.5z"/>
                    </svg>
                    Open in Outlook
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>
                  <button
                    onClick={() => {
                      if (isDemoMode) {
                        alert('Please sign in with your workspace account to send emails.');
                        window.location.href = '/login';
                        return;
                      }
                      window.open(buildGmailUrl(toEmail, subject, body), '_blank');
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-elevated)] border border-border hover:border-accent/50 text-text-secondary hover:text-text-primary rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M6 18V8.4L1.2 5.1A2 2 0 000 7v10a2 2 0 002 2h4z"/>
                      <path fill="#FBBC05" d="M18 18v-9.6l4.8-3.3A2 2 0 0124 7v10a2 2 0 01-2 2h-4z"/>
                      <path fill="#34A853" d="M18 8.4V18H6V8.4L12 13l6-4.6z"/>
                      <path fill="#4285F4" d="M0 7l6 4.4V8.4L12 4 18 8.4v3L24 7a2 2 0 00-2-2H2A2 2 0 000 7z"/>
                    </svg>
                    Gmail
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>
                  <button
                    onClick={() => {
                      if (isDemoMode) {
                        alert('Please sign in with your workspace account to send emails.');
                        window.location.href = '/login';
                        return;
                      }
                      window.location.href = buildMailtoUrl(toEmail, subject, body);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-elevated)] border border-border hover:border-accent/50 text-text-secondary hover:text-text-primary rounded-lg text-sm font-medium transition-colors"
                  >
                    <Mail className="w-4 h-4" strokeWidth={1.75} />
                    Mail App
                  </button>
                  <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-2 text-text-tertiary hover:text-text-primary transition-colors text-sm ml-auto">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ) : (
                /* LinkedIn actions */
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copied
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-[#0a66c2] hover:bg-[#0958a8] text-white'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied to clipboard!' : 'Copy Message'}
                  </button>

                  {linkedinUrl && (
                    <a
                      href={ensureAbsoluteUrl(linkedinUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (isDemoMode) {
                          e.preventDefault();
                          alert('Please sign in with your workspace account for outreach.');
                          window.location.href = '/login';
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-elevated)] border border-[#0a66c2]/30 hover:border-[#0a66c2] text-[#0a66c2] rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      Open Profile
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  )}

                  <p className="w-full text-xs text-text-tertiary text-center pt-1">
                    Copy the message above, then paste it into the LinkedIn compose window.
                  </p>
                </div>
              )}
            </div>
          )}

          {!hasDraft && !isGenerating && (
            <p className="text-xs text-text-tertiary text-center pb-1">
              {isLinkedIn
                ? 'AI will write a platform-optimised LinkedIn message — short, personal, effective.'
                : 'Select a template and click Generate — AI will write a personalised draft in seconds.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
