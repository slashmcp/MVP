'use client';

import { useState } from 'react';
import {
  Users,
  Building2,
  Briefcase,
  ChevronRight,
  TableProperties,
  Upload,
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

      {/* Master Funnel Dropzone */}
      <MasterFunnel />

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

function MasterFunnel() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const { addToast, fetchDatabase, dbCandidates } = useAppStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processResume = async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    
    // Upload PDF
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: data });
    let resumeUrl = '';
    if (uploadRes.ok) {
      const uploadData = await uploadRes.json();
      resumeUrl = uploadData.url;
    }

    // Parse with AI
    const response = await fetch('/api/candidates/parse-resume', { method: 'POST', body: data });
    if (!response.ok) throw new Error('Failed to parse resume');
    const { data: parsedData } = await response.json();

    // Intelligent Matching
    const existing = dbCandidates.find(c => 
      (c.email && parsedData.email && c.email.toLowerCase() === parsedData.email.toLowerCase()) || 
      (c.name && parsedData.name && c.name.toLowerCase() === parsedData.name.toLowerCase())
    );

    const payload = {
      name: parsedData.name || existing?.name || '',
      email: parsedData.email || existing?.email || '',
      phone: parsedData.phone || existing?.phone || '',
      resume: resumeUrl || existing?.resume || '',
      skills: Array.isArray(parsedData.skills) && parsedData.skills.length > 0 ? parsedData.skills : (existing?.skills || []),
      notes: parsedData.notes || existing?.notes || '',
      status: existing ? existing.status : 'New',
      source: existing ? existing.source : 'Upload',
    };

    if (existing) {
      await fetch('/api/candidates', { method: 'PATCH', body: JSON.stringify({ ...payload, id: existing.id }) });
      addToast({ type: 'success', message: `Updated ${payload.name}` });
    } else {
      await fetch('/api/candidates', { method: 'POST', body: JSON.stringify(payload) });
      addToast({ type: 'success', message: `Added ${payload.name}` });
    }
  };

  const processCSV = async (file: File) => {
    const text = await file.text();
    const response = await fetch('/api/analyze-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText: text, filename: file.name })
    });
    
    if (!response.ok) throw new Error('Failed to analyze CSV');
    const { type, count } = await response.json();
    addToast({ type: 'success', message: `Imported ${count} new ${type} from CSV!` });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    
    setIsProcessing(true);
    const files = Array.from(e.dataTransfer.files);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgressText(`Processing ${file.name} (${i + 1}/${files.length})...`);
        
        if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
          await processResume(file);
        } else if (file.name.endsWith('.csv')) {
          await processCSV(file);
        } else {
          addToast({ type: 'error', message: `Unsupported file type: ${file.name}` });
        }
      }
      await fetchDatabase();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'An error occurred during processing.' });
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`card border-2 border-dashed transition-all duration-200 overflow-hidden relative ${
        isDragging ? 'border-accent bg-accent/5' : 'border-border/60 bg-[var(--surface-elevated)]'
      }`}
    >
      <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="p-8 relative z-10 flex flex-col items-center justify-center text-center min-h-[200px]">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-accent animate-pulse">{progressText}</p>
          </div>
        ) : (
          <>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-accent/20' : 'bg-accent/10'}`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-accent' : 'text-accent/70'}`} />
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Master Funnel</h2>
            <p className="text-sm text-text-secondary max-w-lg">
              Drag and drop anything here to intelligently populate your CRM. Supports <span className="font-medium text-text-primary">PDF/DOCX Resumes</span> and <span className="font-medium text-text-primary">Apollo CSV Exports</span>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
