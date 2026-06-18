'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  Sparkles,
  Edit2,
  Phone,
  Globe,
} from 'lucide-react';
import { statusColors } from '@/lib/mock-data';
import { useAppStore } from '@/store/app-store';

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { dbClients, dbJobs } = useAppStore();
  
  const clients = dbClients || [];
  const jobs = dbJobs || [];
  
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <div className="empty-state min-h-[60vh]">
        <p className="text-lg font-medium">Client not found</p>
        <Link href="/clients" className="btn btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Back to Clients
        </Link>
      </div>
    );
  }

  const clientJobs = jobs.filter((j) => j.client === client.companyName);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Back to Clients
      </Link>

      <div className="card">
        <div className="px-6 py-5 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent text-lg font-semibold flex-shrink-0">
              {client.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{client.companyName}</h1>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-text-secondary">
                {client.contactPerson && (
                  <span>{client.contactPerson}</span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {client.email}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`badge ${statusColors[client.status]}`}>{client.status}</span>
                <span className="badge badge-neutral">
                  <Briefcase className="w-3 h-3 mr-1" strokeWidth={1.75} />
                  {client.openRoles} open roles
                </span>
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm">
            <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* AI Company Summary */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" strokeWidth={1.75} />
                <h2 className="text-base font-semibold text-text-primary">AI Company Summary</h2>
              </div>
            </div>
            <div className="card-body space-y-4">
              <p className="text-sm text-text-secondary leading-relaxed">
                {client.notes}
              </p>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">Hiring Intent</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Active hiring across engineering and product roles. Strong growth trajectory with 
                  competitive compensation. Typical time-to-hire is 2–3 weeks from initial submission.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">Recommended Next Steps</h3>
                <ul className="text-sm text-text-secondary space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    Schedule weekly check-in to review pipeline progress
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    Submit David Kim for Staff Backend Engineer role
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    Follow up on Emily Rodriguez submission feedback
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Open Roles */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-text-primary">Open Roles</h2>
            </div>
            {clientJobs.length > 0 ? (
              <div className="divide-y divide-border">
                {clientJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-[var(--surface-elevated)] transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                        {job.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                        {job.location && <span>{job.location}</span>}
                        {job.salaryMin && job.salaryMax && (
                          <span className="font-mono">
                            ${(job.salaryMin / 1000).toFixed(0)}k–${(job.salaryMax / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`badge ${statusColors[job.status]}`}>{job.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state py-10">
                <p className="text-sm">No open roles for this client.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-text-primary">Details</h2>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Contact</span>
                <span className="text-text-primary">{client.contactPerson || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Email</span>
                <span className="text-text-primary text-xs">{client.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Status</span>
                <span className={`badge ${statusColors[client.status]}`}>{client.status}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Added
                </span>
                <span className="text-text-primary font-mono text-xs">
                  {client.createdAt
                    ? new Date(client.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
