'use client';

import { useState } from 'react';
import {
  Sparkles,
  Search,
  Users,
  Building2,
  Briefcase,
  ChevronRight,
  Loader2,
  Globe,
  Code,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/store/app-store';
import {
  statusColors,
} from '@/lib/mock-data';

export default function DashboardPage() {
  const { 
    hiddenCandidateIds, 
    hiddenClientIds, 
    hiddenJobIds, 
    dbCandidates, 
    dbJobs, 
    dbClients,
    dbSequences,
    showCredentialPrompt,
    bypassedServices,
    addToast,
    fetchDatabase
  } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSourcing, setIsSourcing] = useState(false);
  const [sourcedLeads, setSourcedLeads] = useState<any[] | null>(null);
  const [sourcingProvider, setSourcingProvider] = useState<'juicebox' | 'serper'>('juicebox');
  
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
    if (!searchQuery.trim()) return;
    setIsSourcing(true);
    try {
      const res = await fetch('/api/sourcing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: 'dashboard_quick_source',
          query: searchQuery,
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
      const seq = (dbSequences || []).find(s => s.id === selectedSequenceId);
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
          status: 'Contacted'
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

  const cands = dbCandidates || [];
  const jobs = dbJobs || [];
  const clients = dbClients || [];
  const sequences = dbSequences || [];

  const activeCandidates = cands
    .filter(c => !hiddenCandidateIds.includes(c.id))
    .filter((c) => c.status !== 'Placed' && c.status !== 'Rejected')
    .slice(0, 5);

  const activeJobs = jobs
    .filter(j => !hiddenJobIds?.includes(j.id))
    .filter((j) => j.status === 'Open' || j.status === 'Interviewing')
    .slice(0, 5);

  const activeClients = clients
    .filter(c => !hiddenClientIds.includes(c.id))
    .filter((c) => c.status === 'Active')
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Command Center</h1>
        <p className="text-sm text-text-secondary mt-1">
          Your unified recruitment and sourcing overview.
        </p>
      </div>

      {/* Quick Source Banner (The New V2 Focus) */}
      <div className="card bg-accent-soft border border-accent/20 overflow-hidden relative">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="p-6 relative z-10 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 space-y-3">
            <h2 className="text-lg font-semibold text-accent flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Sourcing Engine
            </h2>
            <p className="text-sm text-text-secondary max-w-lg">
              Paste a Job Description or enter a role title. The AI will instantly search Google and LinkedIn to find the top matches.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 max-w-2xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input 
                  type="text" 
                  className="input pl-10 w-full bg-surface border-border focus:border-accent/50" 
                  placeholder="e.g. Senior Frontend Engineer with Next.js..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSource();
                    }
                  }}
                />
              </div>
              
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-surface border border-border px-3 py-2 rounded-lg font-medium shadow-sm shrink-0">
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

                <button 
                  onClick={handleSource}
                  disabled={isSourcing || !searchQuery.trim()}
                  className="btn btn-primary bg-accent hover:bg-accent-hover text-white border-transparent shadow-accent/25 shrink-0 flex items-center gap-1.5 font-medium"
                >
                  {isSourcing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {isSourcing ? 'Sourcing...' : 'Start Sourcing'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sourcing Engine Results */}
      {sourcedLeads && (
        <div className="card border-accent/20 animate-slide-up shadow-lg mt-6">
          <div className="card-header bg-accent-soft border-b border-border py-4 px-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" strokeWidth={1.75} />
                <h2 className="text-base font-semibold text-text-primary">Sourced Leads for &quot;{searchQuery}&quot;</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-blue">{sourcedLeads.length} Found</span>
                <button 
                  onClick={() => setSourcedLeads(null)}
                  className="text-xs text-text-secondary hover:text-text-primary ml-2 font-medium"
                >
                  Clear Results
                </button>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-border">
            {sourcedLeads.map((c) => {
              const isAdded = addedLeads.has(c.id);
              const isEnrolled = enrolledLeads[c.id];
              const hasLivingCV = c.education || (c.workHistory && c.workHistory.length > 0) || c.linkedinUrl || c.githubUrl || c.stackoverflowUrl || c.scholarUrl;

              return (
                <div key={c.id} className="p-5 hover:bg-[var(--surface-elevated)] transition-all duration-200 animate-fade-in">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-text-primary">
                          {c.name}
                        </h3>
                        <span className="badge badge-neutral text-[10px]">{c.source}</span>
                        {isAdded && (
                          <span className="badge badge-success text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> CRM
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
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m18 16 4-4-4-4" />
                                <path d="m6 8-4 4 4 4" />
                                <path d="m14.5 4-5 16" />
                              </svg>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Column 1: Recent Candidates */}
        <div className="card flex flex-col min-h-[400px]">
          <div className="card-header border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <h2 className="text-base font-semibold text-text-primary">Recent Candidates</h2>
            </div>
            <Link href="/candidates" className="text-sm font-medium text-accent hover:text-accent-hover flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="card-body p-0 divide-y divide-border flex-1">
            {activeCandidates.length > 0 ? (
              activeCandidates.map(candidate => (
                <Link key={candidate.id} href={`/candidates/${candidate.id}`} className="block p-4 hover:bg-[var(--surface-elevated)] transition-colors group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{candidate.name}</h3>
                      <p className="text-xs text-text-secondary mt-1">{candidate.role}</p>
                    </div>
                    <span className={`badge ${statusColors[candidate.status] || 'badge-blue'}`}>{candidate.status}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center text-text-tertiary h-full">
                <Users className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium text-text-secondary">No candidates yet</p>
                <p className="text-xs mt-1">Use the AI Sourcing Engine to find candidates.</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Open Roles (Jobs) */}
        <div className="card flex flex-col min-h-[400px]">
          <div className="card-header border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-accent" />
              <h2 className="text-base font-semibold text-text-primary">Open Roles</h2>
            </div>
            <Link href="/jobs" className="text-sm font-medium text-accent hover:text-accent-hover flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="card-body p-0 divide-y divide-border flex-1">
            {activeJobs.length > 0 ? (
              activeJobs.map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="block p-4 hover:bg-[var(--surface-elevated)] transition-colors group">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{job.title}</h3>
                    <p className="text-xs text-text-secondary">{job.client} &middot; {job.location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${statusColors[job.status] || 'badge-blue'}`}>{job.status}</span>
                      {job.priority === 'High' && <span className="badge badge-red">High Priority</span>}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center text-text-tertiary h-full">
                <Briefcase className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium text-text-secondary">No open roles</p>
                <p className="text-xs mt-1">Add jobs to track your hiring goals.</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Active Clients */}
        <div className="card flex flex-col min-h-[400px]">
          <div className="card-header border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              <h2 className="text-base font-semibold text-text-primary">Active Clients</h2>
            </div>
            <Link href="/clients" className="text-sm font-medium text-accent hover:text-accent-hover flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="card-body p-0 divide-y divide-border flex-1">
            {activeClients.length > 0 ? (
              activeClients.map(client => (
                <Link key={client.id} href={`/clients/${client.id}`} className="block p-4 hover:bg-[var(--surface-elevated)] transition-colors group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{client.companyName}</h3>
                      <p className="text-xs text-text-secondary mt-1">{client.industry} &middot; {client.location}</p>
                    </div>
                    <span className={`badge ${statusColors[client.status] || 'badge-blue'}`}>{client.status}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center text-text-tertiary h-full">
                <Building2 className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium text-text-secondary">No active clients</p>
                <p className="text-xs mt-1">Add clients to see them here.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
