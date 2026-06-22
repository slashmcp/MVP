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

      {/* Import Data Banner (The New V2 Focus) */}
      <div className="card bg-accent-soft border border-accent/20 overflow-hidden relative">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="p-6 relative z-10 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 space-y-3">
            <h2 className="text-lg font-semibold text-accent flex items-center gap-2">
              <TableProperties className="w-5 h-5" />
              Import Data & Candidates
            </h2>
            <p className="text-sm text-text-secondary max-w-lg">
              Bulk import your sourced candidates from Juicebox, Apify, or Apollo. Our Anthropic AI will automatically map the columns into your CRM database.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 max-w-2xl">
              <Link href="/candidates" className="btn btn-primary bg-accent hover:bg-accent-hover text-white border-transparent shadow-accent/25 shrink-0 flex items-center gap-1.5 font-medium">
                <Upload className="w-4 h-4" /> Go to Bulk Import
              </Link>
            </div>
          </div>
        </div>
      </div>

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
