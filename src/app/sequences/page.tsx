'use client';

import { useState } from 'react';
import { Play, Pause, Plus, MoreVertical, Mail, MessageCircle, Clock, Search, Workflow, Target, Send, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

// Mock sequences data
const mockSequences = [
  {
    id: 'seq_1',
    name: 'Senior Frontend Dev (React) - Safe Software',
    status: 'Active',
    enrolled: 0,
    replied: 0,
    bounced: 0,
    steps: [
      { id: 's1', type: 'Email', delay: 'Day 1' },
      { id: 's2', type: 'LinkedIn', delay: 'Day 3' },
      { id: 's3', type: 'Email', delay: 'Day 7' },
    ]
  },
  {
    id: 'seq_2',
    name: 'AI/ML Engineer (C++) - Creativity Software',
    status: 'Active',
    enrolled: 0,
    replied: 0,
    bounced: 0,
    steps: [
      { id: 's1', type: 'LinkedIn', delay: 'Day 1' },
      { id: 's2', type: 'Email', delay: 'Day 2' },
      { id: 's3', type: 'Call', delay: 'Day 5' },
    ]
  }
];

export default function SequencesPage() {
  const [search, setSearch] = useState('');

  const filteredSequences = mockSequences.filter(seq => 
    seq.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Sequences</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your automated multi-step outreach campaigns.
          </p>
        </div>
        <button className="btn btn-primary bg-accent hover:bg-accent-hover text-white border-transparent">
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          Create Sequence
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
        <Workflow className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Local Sequence Engine</h3>
          <p className="text-sm text-text-secondary mt-1">
            Candidates added to these sequences will be automatically processed by the local engine, lightning the load on your n8n workflows. Step execution is processed in the background.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search sequences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSequences.map(seq => (
          <div key={seq.id} className="card flex flex-col hover:border-accent/30 transition-colors">
            <div className="card-header pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary line-clamp-1">{seq.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${seq.status === 'Active' ? 'text-success' : 'text-text-tertiary'}`}>
                      {seq.status === 'Active' ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                      {seq.status}
                    </span>
                  </div>
                </div>
                <button className="p-1.5 rounded-md text-text-tertiary hover:bg-[var(--surface-elevated)] transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-5 py-4 border-y border-border bg-[var(--surface-elevated)] flex gap-6">
              <div>
                <p className="text-xs text-text-secondary mb-0.5">Enrolled</p>
                <p className="text-lg font-semibold text-text-primary">{seq.enrolled}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-0.5">Replied</p>
                <p className="text-lg font-semibold text-accent">
                  {seq.replied} <span className="text-xs text-text-tertiary font-normal">({Math.round((seq.replied / seq.enrolled) * 100 || 0)}%)</span>
                </p>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Steps</p>
              <div className="space-y-3 flex-1">
                {seq.steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-medium text-text-secondary shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-[var(--surface-elevated)] border border-border flex-1">
                      {step.type === 'Email' ? <Mail className="w-3.5 h-3.5 text-text-secondary" /> : 
                       step.type === 'LinkedIn' ? <MessageCircle className="w-3.5 h-3.5 text-text-secondary" /> :
                       <Clock className="w-3.5 h-3.5 text-text-secondary" />}
                      <span className="text-xs font-medium text-text-primary">{step.type}</span>
                      <span className="text-[10px] text-text-tertiary ml-auto bg-surface px-1.5 py-0.5 rounded">{step.delay}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-border mt-auto flex gap-2">
              <button className="btn btn-secondary flex-1">View Analytics</button>
              <button className="btn btn-secondary flex-1">Edit Sequence</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
