'use client';

import { useState, useRef, useEffect } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to parse resume (Status: ${response.status})`);
    }
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

  const traverseFileTree = async (item: any): Promise<File[]> => {
    return new Promise((resolve) => {
      if (item.isFile) {
        item.file((file: File) => resolve([file]));
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        dirReader.readEntries(async (entries: any[]) => {
          const filesPromises = entries.map(entry => traverseFileTree(entry));
          const filesArrays = await Promise.all(filesPromises);
          resolve(filesArrays.flat());
        });
      } else {
        resolve([]);
      }
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!e.dataTransfer.items || e.dataTransfer.items.length === 0) return;
    
    setIsProcessing(true);
    let allFiles: File[] = [];
    
    const items = Array.from(e.dataTransfer.items);
    const itemPromises = items.map(item => {
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) return traverseFileTree(entry);
      }
      return Promise.resolve([]);
    });
    
    const filesArrays = await Promise.all(itemPromises);
    allFiles = filesArrays.flat().filter(f => !!f && !f.name.startsWith('.'));
    
    if (allFiles.length === 0) {
      allFiles = Array.from(e.dataTransfer.files);
    }
    
    try {
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        setProgressText(`Processing ${file.name} (${i + 1}/${allFiles.length})...`);
        
        const ext = file.name.toLowerCase();
        if (ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.txt')) {
          await processResume(file).catch(err => {
            console.error(`Error processing ${file.name}:`, err);
            addToast({ type: 'error', message: `Skipped ${file.name} (Parsing failed)` });
          });
        } else if (ext.endsWith('.csv')) {
          await processCSV(file).catch(err => {
            console.error(`Error processing ${file.name}:`, err);
            addToast({ type: 'error', message: `Skipped ${file.name} (CSV Parsing failed)` });
          });
        } else {
          console.warn(`Unsupported file type: ${file.name}`);
        }
      }
      await fetchDatabase();
      addToast({ type: 'success', message: 'Master Funnel processing complete!' });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'An error occurred during processing.' });
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsProcessing(true);
    const allFiles = Array.from(e.target.files);
    
    try {
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        setProgressText(`Processing ${file.name} (${i + 1}/${allFiles.length})...`);
        
        const ext = file.name.toLowerCase();
        if (ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.txt')) {
          await processResume(file).catch((err: any) => {
            console.error(`Error processing ${file.name}:`, err);
            addToast({ type: 'error', message: `Skipped ${file.name} (${err.message})` });
          });
        } else if (ext.endsWith('.csv')) {
          await processCSV(file).catch(err => {
            console.error(`Error processing ${file.name}:`, err);
            addToast({ type: 'error', message: `Skipped ${file.name} (CSV Parsing failed)` });
          });
        } else {
          console.warn(`Unsupported file type: ${file.name}`);
        }
      }
      await fetchDatabase();
      addToast({ type: 'success', message: 'Master Funnel processing complete!' });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'An error occurred during processing.' });
    } finally {
      setIsProcessing(false);
      setProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTextareaPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const text = e.clipboardData.getData('text');
    if (!text || !text.trim()) return;

    setIsProcessing(true);
    setProgressText('Extracting candidates from pasted text...');
    
    try {
      const response = await fetch('/api/candidates/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to parse pasted text');
      }
      
      const { data } = await response.json();
      
      let added = 0;
      let updated = 0;
      
      for (const parsedData of data) {
        if (!parsedData.name && !parsedData.email) continue;
        
        const existing = dbCandidates.find(c => 
          (c.email && parsedData.email && c.email.toLowerCase() === parsedData.email.toLowerCase()) || 
          (c.name && parsedData.name && c.name.toLowerCase() === parsedData.name.toLowerCase())
        );
        
        const payload = {
          name: parsedData.name || existing?.name || '',
          email: parsedData.email || existing?.email || '',
          phone: parsedData.phone || existing?.phone || '',
          location: parsedData.location || existing?.location || '',
          role: parsedData.role || existing?.role || '',
          company: parsedData.company || existing?.company || '',
          seniority: parsedData.seniority || existing?.seniority || '',
          linkedinUrl: parsedData.linkedinUrl || existing?.linkedin_url || existing?.linkedinUrl || '',
          websiteUrl: parsedData.websiteUrl || existing?.website_url || existing?.websiteUrl || '',
          resume: existing?.resume || '',
          skills: Array.isArray(parsedData.skills) && parsedData.skills.length > 0 ? parsedData.skills : (existing?.skills || []),
          notes: parsedData.notes || existing?.notes || '',
          status: existing ? existing.status : 'New',
          source: existing ? existing.source : 'Text Paste',
        };

        if (existing) {
          await fetch('/api/candidates', { method: 'PATCH', body: JSON.stringify({ ...payload, id: existing.id }) });
          updated++;
        } else {
          await fetch('/api/candidates', { method: 'POST', body: JSON.stringify(payload) });
          added++;
        }
      }
      
      await fetchDatabase();
      addToast({ type: 'success', message: `Pasted text processed! Added ${added}, Updated ${updated}.` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to process pasted text.' });
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };


  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`card border-2 border-dashed transition-all duration-200 overflow-hidden relative cursor-pointer hover:border-accent/60 ${
        isDragging ? 'border-accent bg-accent/5' : 'border-border/60 bg-[var(--surface-elevated)]'
      }`}
    >
      <input 
        type="file" 
        multiple 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileInput} 
        accept=".pdf,.docx,.txt,.csv" 
      />
      <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="p-6 relative z-10 flex flex-col md:flex-row items-center justify-between min-h-[100px] gap-6">
        {isProcessing ? (
          <div className="flex w-full items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-accent animate-pulse">{progressText}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${isDragging ? 'bg-accent/20' : 'bg-accent/10'}`}>
                <Upload className={`w-6 h-6 ${isDragging ? 'text-accent' : 'text-accent/70'}`} />
              </div>
              <div className="flex-1 w-full">
                <h2 className="text-lg font-semibold text-text-primary mb-1">Master Funnel</h2>
                <p className="text-sm text-text-secondary mb-4">
                  Drag & drop files, click to upload, or paste a list of candidates into the field below to populate your CRM.
                </p>
                <textarea 
                  className="w-full bg-[var(--surface-overlay)] border border-border/60 hover:border-accent/40 rounded-lg p-3 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none shadow-inner"
                  rows={3}
                  placeholder="Right-click and paste candidate text here..."
                  onClick={(e) => e.stopPropagation()}
                  onPaste={handleTextareaPaste}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
