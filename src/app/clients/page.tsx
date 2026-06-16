'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Briefcase,
  Mail,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { mockClients, statusColors } from '@/lib/mock-data';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { showCredentialPrompt, hiddenClientIds, hideClient } = useAppStore();

  const filtered = useMemo(() => {
    return mockClients.filter((c) => {
      if (hiddenClientIds.includes(c.id)) return false;
      const matchSearch =
        !search ||
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPerson?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, hiddenClientIds]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Clients</h1>
          <p className="text-sm text-text-secondary mt-1">
            {mockClients.length} total &middot; {mockClients.filter((c) => c.status === 'Active').length} active
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          id="add-client-btn"
          onClick={() => showCredentialPrompt({ service: 'google-sheets', feature: 'Save New Client' })}
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          Add Client
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Search by company or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            id="client-search"
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'Active', 'Prospect', 'Inactive'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`btn-xs rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] border border-border'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((client) => (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="card p-5 group hover:shadow-md transition-all duration-150"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-sm font-semibold flex-shrink-0">
                {client.companyName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${statusColors[client.status]}`}>{client.status}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm(`Are you sure you want to delete ${client.companyName}?`)) {
                      hideClient(client.id);
                    }
                  }}
                  className="p-1 rounded text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Client"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
              {client.companyName}
            </h3>
            {client.contactPerson && (
              <p className="text-sm text-text-secondary mt-1">{client.contactPerson}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" strokeWidth={1.75} />
                {client.openRoles} open role{client.openRoles !== 1 ? 's' : ''}
              </span>
              {client.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {client.email}
                </span>
              )}
            </div>
            {client.notes && (
              <p className="text-xs text-text-tertiary mt-3 line-clamp-2 leading-relaxed">
                {client.notes}
              </p>
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <Search className="w-10 h-10 mb-3 text-text-tertiary" strokeWidth={1.25} />
          <p className="text-sm font-medium">No clients found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
