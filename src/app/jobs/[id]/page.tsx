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
  Loader2,
  Globe,
  Code,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { useState } from 'react';
import { statusColors } from '@/lib/mock-data';
import { useAppStore } from '@/store/app-store';
import { EditJobModal } from '@/components/ui/EditJobModal';

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { dbJobs, dbCandidates, dbSequences, showCredentialPrompt, bypassedServices, addToast, fetchDatabase } = useAppStore();
  
  const jobs = dbJobs || [];
  const cands = dbCandidates || [];
  const sequences = dbSequences || [];
  
  const job = jobs.find((j) => j.id === id);

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
  const [isSourcing, setIsSourcing] = useState(false);
  const [sourcedLeads, setSourcedLeads] = useState<any[] | null>(null);
  const [sourcingProvider, setSourcingProvider] = useState<'juicebox' | 'serper'>('juicebox');
  const [showEditModal, setShowEditModal] = useState(false);
  
  // CRM tracking
  const [addedLeads, setAddedLeads] = useState<Set<string>>(new Set());
  const [isAddingLead, setIsAddingLead] = useState<string | null>(null);
  
  // Sequence tracking
  const [activeSequenceSelector, setActiveSequenceSelector] = useState<string | null>(null);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>('');
  const [isEnrollingLead, setIsEnrollingLead] = useState<string | null>(null);
  const [enrolledLeads, setEnrolledLeads] = useState<Record<string, string>>({}); // maps lead ID to sequence name
  
  // Expanded CV state for Juicebox candidates
  const [expandedCVs, setExpandedCVs] = useState<Set<string>>(new Set());

  const toggleCV = (leadId: string) => {
    const next = new Set(expandedCVs);
    if (next.has(leadId)) {
      next.delete(leadId);
    } else {
      next.add(leadId);
    }
    setExpandedCVs(next);
  };

  const handleSource = async () => {
    setIsSourcing(true);
    try {
      const res = await fetch('/api/sourcing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          query: job.requirements,
          provider: sourcingProvider,
          mock: bypassedServices.includes(sourcingProvider)
        }),
      });
      const data = await res.json();
      if (data.error === 'MISSING_API_KEY') {
        showCredentialPrompt({
          service: data.provider || 'juicebox',
          feature: data.provider === 'juicebox' ? 'AI Candidate Sourcing (PeopleGPT)' : 'Live Google Search Sourcing'
        });
        return;
      }
      
      if (data.success) {
        setSourcedLeads(data.leads);
        setAddedLeads(new Set());
        setEnrolledLeads({});
        setActiveSequenceSelector(null);
      }
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'Sourcing failed. Please check network connection.' });
    } finally {
      setIsSourcing(false);
    }
  };

  const handleAddLeadToCrm = async (lead: any) => {
    setIsAddingLead(lead.id);
    try {
      const payload = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        location: lead.location,
        role: lead.role || lead.seniority,
        company: lead.company || 'Unknown',
        skills: lead.skills,
        experience: lead.experience || 'Not specified',
        seniority: lead.seniority || 'Mid/Senior',
        linkedinUrl: lead.linkedinUrl,
        websiteUrl: lead.githubUrl || lead.stackoverflowUrl || lead.scholarUrl || '',
        source: lead.source || 'Juicebox (PeopleGPT)',
        notes: lead.notes + 
          (lead.education ? `\n\nEducation: ${lead.education}` : '') + 
          (lead.workHistory ? `\n\nWork History:\n${lead.workHistory.map((w: any) => `- ${w.role} at ${w.company} (${w.duration})`).join('\n')}` : ''),
        status: 'New'
      };

      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        const nextAdded = new Set(addedLeads);
        nextAdded.add(lead.id);
        setAddedLeads(nextAdded);
        addToast({ type: 'success', message: `${lead.name} added to CRM successfully!` });
        await fetchDatabase();
      } else {
        addToast({ type: 'error', message: data.error || 'Failed to add candidate to CRM' });
      }
    } catch (e) {
      console.error('Error adding to CRM:', e);
      addToast({ type: 'error', message: 'An error occurred while adding to CRM.' });
    } finally {
      setIsAddingLead(null);
    }
  };

  const handleEnrollInSequence = async (lead: any) => {
    if (!selectedSequenceId) return;
    setIsEnrollingLead(lead.id);
    try {
      const seq = sequences.find(s => s.id === selectedSequenceId);
      if (!seq) throw new Error('Sequence not found');

      // 1. Add candidate to CRM if not already added
      let candidateId = '';
      const isAlreadyAdded = addedLeads.has(lead.id);
      
      if (!isAlreadyAdded) {
        const payload = {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          location: lead.location,
          role: lead.role || lead.seniority,
          company: lead.company || 'Unknown',
          skills: lead.skills,
          experience: lead.experience || 'Not specified',
          seniority: lead.seniority || 'Mid/Senior',
          linkedinUrl: lead.linkedinUrl,
          websiteUrl: lead.githubUrl || lead.stackoverflowUrl || lead.scholarUrl || '',
          source: lead.source || 'Juicebox (PeopleGPT)',
          notes: lead.notes + `\n\n[Enrolled in Campaign: ${seq.name}]` +
            (lead.education ? `\n\nEducation: ${lead.education}` : '') + 
            (lead.workHistory ? `\n\nWork History:\n${lead.workHistory.map((w: any) => `- ${w.role} at ${w.company} (${w.duration})`).join('\n')}` : ''),
          status: 'Contacted' // Set status to Contacted since they are enrolled
        };

        const res = await fetch('/api/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to create candidate for sequence enrollment');
        }
        candidateId = data.data.id;
        
        const nextAdded = new Set(addedLeads);
        nextAdded.add(lead.id);
        setAddedLeads(nextAdded);
      } else {
        // If already in CRM, find them in cands list and update them
        const existing = cands.find(c => c.name === lead.name || c.email === lead.email);
        if (existing) {
          candidateId = existing.id;
          await fetch('/api/candidates', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: candidateId,
              status: 'Contacted',
              notes: (existing.notes || '') + `\n\n[Enrolled in Campaign: ${seq.name}]`
            })
          });
        }
      }

      // 2. Increment Sequence enrollment
      const seqRes = await fetch('/api/sequences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequenceId: selectedSequenceId })
      });
      const seqData = await seqRes.json();
      
      if (seqData.success) {
        setEnrolledLeads(prev => ({ ...prev, [lead.id]: seq.name }));
        addToast({ type: 'success', message: `${lead.name} successfully enrolled in "${seq.name}"!` });
        setActiveSequenceSelector(null);
        await fetchDatabase();
      } else {
        addToast({ type: 'error', message: seqData.error || 'Failed to update sequence enrollment' });
      }
    } catch (e: any) {
      console.error('Error enrolling in sequence:', e);
      addToast({ type: 'error', message: e.message || 'An error occurred while enrolling in campaign.' });
    } finally {
      setIsEnrollingLead(null);
    }
  };

  const matchedCandidates = cands.slice(0, 4).map((c: any, i: number) => ({
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-[var(--surface-elevated)] border border-border px-2.5 py-1.5 rounded-lg font-medium shadow-sm">
              <span>Engine:</span>
              <select
                value={sourcingProvider}
                onChange={(e) => setSourcingProvider(e.target.value as 'juicebox' | 'serper')}
                className="bg-transparent font-semibold text-accent focus:outline-none cursor-pointer"
                disabled={isSourcing}
              >
                <option value="juicebox" className="bg-surface text-text-primary">PeopleGPT (Juicebox)</option>
                <option value="serper" className="bg-surface text-text-primary">LinkedIn (Serper)</option>
              </select>
            </div>
            
            <button onClick={() => setShowEditModal(true)} className="btn btn-secondary btn-sm">
              <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              Edit
            </button>
            <button className="btn btn-primary btn-sm bg-accent hover:bg-accent-hover border-transparent shadow-sm" onClick={handleSource} disabled={isSourcing}>
              {isSourcing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />}
              {isSourcing ? 'Sourcing...' : 'Find Candidates'}
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditJobModal
          job={job}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            fetchDatabase(); // Refresh the global store
          }}
        />
      )}

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

          {/* Sourcing Engine Results */}
          {sourcedLeads && (
            <div className="card border-accent/20 animate-slide-up shadow-lg">
              <div className="card-header bg-accent-soft border-b border-border py-4 px-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-accent" strokeWidth={1.75} />
                    <h2 className="text-base font-semibold text-text-primary">Sourced Leads</h2>
                  </div>
                  <span className="badge badge-blue">{sourcedLeads.length} Found</span>
                </div>
              </div>
              
              <div className="divide-y divide-border">
                {sourcedLeads.map((c) => {
                  const isAdded = addedLeads.has(c.id);
                  const isEnrolled = enrolledLeads[c.id];
                  const hasLivingCV = c.education || (c.workHistory && c.workHistory.length > 0) || c.githubUrl || c.stackoverflowUrl || c.scholarUrl;

                  return (
                    <div key={c.id} className="p-5 hover:bg-[var(--surface-elevated)] transition-all duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-text-primary">
                              {c.name}
                            </h3>
                            <span className="badge badge-neutral text-[10px]">{c.source}</span>
                            {isAdded && (
                              <span className="badge badge-success text-[10px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> CRM
                              </span>
                            )}
                            {isEnrolled && (
                              <span className="badge badge-blue text-[10px] font-mono">
                                Campaign: {isEnrolled}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mt-1 font-mono">
                            {c.seniority} • {c.email} {c.phone && c.phone !== 'N/A' && `• ${c.phone}`}
                          </p>
                          {c.location && (
                            <p className="text-[11px] text-text-tertiary mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" /> {c.location}
                            </p>
                          )}
                        </div>
                        <div className={`score-badge ${c.aiFitScore >= 80 ? 'score-high' : c.aiFitScore >= 60 ? 'score-medium' : 'score-low'} shadow-sm`}>
                          {c.aiFitScore}
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {c.skills.slice(0, 6).map((s: string) => (
                          <span key={s} className="badge badge-blue text-[10px] px-1.5 py-0.5">
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Notes Summary */}
                      <p className="text-xs text-text-secondary mt-3 leading-relaxed border-l-2 border-border pl-2.5 italic">
                        {c.notes}
                      </p>

                      {/* Juicebox Aggregate Sources & Living CV Details */}
                      {hasLivingCV && (
                        <div className="mt-4 bg-surface border border-border rounded-xl p-3.5 shadow-sm space-y-3">
                          {/* Aggregated Profile badged links */}
                          <div className="flex items-center justify-between border-b border-border pb-2 flex-wrap gap-2">
                            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Aggregated Sources</span>
                            <div className="flex items-center gap-2">
                              {c.linkedinUrl && (
                                <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-[var(--surface-elevated)] border border-border hover:border-accent hover:text-accent transition-colors flex items-center justify-center" title="LinkedIn">
                                  <Globe className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {c.githubUrl && (
                                <a href={c.githubUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-[var(--surface-elevated)] border border-border hover:border-accent hover:text-accent transition-colors flex items-center justify-center" title="GitHub">
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                    <path d="M9 18c-4.51 2-5-2-7-2" />
                                  </svg>
                                </a>
                              )}
                              {c.stackoverflowUrl && (
                                <a href={c.stackoverflowUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-[var(--surface-elevated)] border border-border hover:border-accent hover:text-accent transition-colors flex items-center justify-center" title="StackOverflow">
                                  <Code className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {c.scholarUrl && (
                                <a href={c.scholarUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-[var(--surface-elevated)] border border-border hover:border-accent hover:text-accent transition-colors flex items-center justify-center" title="Google Scholar">
                                  <BookOpen className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Expandable CV Section */}
                          <div>
                            <button
                              onClick={() => toggleCV(c.id)}
                              className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors flex items-center gap-1.5 focus:outline-none"
                            >
                              {expandedCVs.has(c.id) ? (
                                <><ChevronUp className="w-3.5 h-3.5" /> Hide Living CV</>
                              ) : (
                                <><ChevronDown className="w-3.5 h-3.5" /> View Living CV (Experience & Education)</>
                              )}
                            </button>

                            {expandedCVs.has(c.id) && (
                              <div className="mt-3 space-y-3 pt-2 border-t border-dashed border-border animate-slide-down">
                                {c.education && (
                                  <div className="flex items-start gap-2 text-xs">
                                    <GraduationCap className="w-4 h-4 text-text-tertiary mt-0.5 shrink-0" />
                                    <div>
                                      <p className="font-semibold text-text-primary">Education</p>
                                      <p className="text-text-secondary mt-0.5">{c.education}</p>
                                    </div>
                                  </div>
                                )}
                                {c.workHistory && c.workHistory.length > 0 && (
                                  <div className="flex items-start gap-2 text-xs">
                                    <Briefcase className="w-4 h-4 text-text-tertiary mt-0.5 shrink-0" />
                                    <div className="space-y-2 flex-1">
                                      <p className="font-semibold text-text-primary">Experience History</p>
                                      <div className="divide-y divide-border">
                                        {c.workHistory.map((work: any, idx: number) => (
                                          <div key={idx} className="py-1.5 first:pt-0 last:pb-0">
                                            <p className="font-medium text-text-primary">{work.role}</p>
                                            <p className="text-text-secondary text-[11px] mt-0.5">{work.company} &middot; <span className="font-mono text-text-tertiary">{work.duration}</span></p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          onClick={() => handleAddLeadToCrm(c)}
                          disabled={isAdded || isAddingLead === c.id}
                          className={`btn btn-xs py-1.5 px-3 rounded-lg font-medium shadow-sm transition-all flex items-center gap-1.5 ${
                            isAdded
                              ? 'bg-success-soft text-success border border-success/20 cursor-default'
                              : 'btn-primary bg-accent hover:bg-accent-hover text-white border-transparent'
                          }`}
                        >
                          {isAddingLead === c.id ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Adding...</>
                          ) : isAdded ? (
                            <><CheckCircle2 className="w-3 h-3" /> Added to CRM</>
                          ) : (
                            'Add to CRM'
                          )}
                        </button>

                        <button
                          onClick={() => {
                            if (activeSequenceSelector === c.id) {
                              setActiveSequenceSelector(null);
                            } else {
                              setActiveSequenceSelector(c.id);
                              setSelectedSequenceId('');
                            }
                          }}
                          disabled={isEnrollingLead === c.id}
                          className="btn btn-secondary btn-xs py-1.5 px-3 rounded-lg font-medium border border-border text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)]"
                        >
                          {isEnrollingLead === c.id ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Enrolling...</>
                          ) : isEnrolled ? (
                            'Enroll in another campaign'
                          ) : (
                            'Send to Sequence'
                          )}
                        </button>
                      </div>

                      {/* Sequence Selector Dropdown Drawer */}
                      {activeSequenceSelector === c.id && (
                        <div className="mt-3.5 bg-surface border border-border rounded-xl p-3 shadow-md animate-slide-up space-y-2.5">
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-semibold text-text-secondary">Enroll Candidate in Campaign Sequence</p>
                            <button onClick={() => setActiveSequenceSelector(null)} className="text-[10px] text-text-tertiary hover:text-text-primary">Cancel</button>
                          </div>
                          <div className="flex gap-2">
                            <select
                              value={selectedSequenceId}
                              onChange={(e) => setSelectedSequenceId(e.target.value)}
                              className="input py-1 px-2.5 text-xs flex-1 h-8 rounded-lg bg-[var(--surface-elevated)] border-border"
                            >
                              <option value="">-- Choose Campaign --</option>
                              {sequences.map((seq) => (
                                <option key={seq.id} value={seq.id}>
                                  {seq.name} ({seq.steps?.length || 0} steps)
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleEnrollInSequence(c)}
                              disabled={!selectedSequenceId || isEnrollingLead === c.id}
                              className="btn btn-primary btn-xs bg-accent text-white py-1 px-3 h-8 rounded-lg shadow-sm"
                            >
                              Enroll Candidate
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
                        {c.name.split(' ').map((n: string) => n[0]).join('')}
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
