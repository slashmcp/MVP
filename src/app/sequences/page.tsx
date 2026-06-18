'use client';

import { useState } from 'react';
import { Play, Pause, Plus, MoreVertical, Mail, MessageCircle, Clock, Search, Workflow, X, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { createSequence } from '@/lib/db-client';
import type { SequenceStep } from '@/lib/schemas';

export default function SequencesPage() {
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSeqName, setNewSeqName] = useState('');
  const [newSeqSteps, setNewSeqSteps] = useState<SequenceStep[]>([
    { id: 's1', type: 'Email', delay: 'Day 1' }
  ]);

  const { dbSequences, fetchDatabase } = useAppStore();
  const sequences = dbSequences || [];

  const filteredSequences = sequences.filter(seq => 
    seq.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddStep = () => {
    setNewSeqSteps([
      ...newSeqSteps, 
      { id: `s${Date.now()}`, type: 'Email', delay: `Day ${newSeqSteps.length * 2 + 1}` }
    ]);
  };

  const handleRemoveStep = (id: string) => {
    setNewSeqSteps(newSeqSteps.filter(s => s.id !== id));
  };

  const handleUpdateStep = (id: string, field: 'type' | 'delay', value: string) => {
    setNewSeqSteps(newSeqSteps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleCreateSequence = async () => {
    if (!newSeqName) return;
    setIsSaving(true);
    
    const res = await createSequence({
      name: newSeqName,
      status: 'Active',
      steps: newSeqSteps
    });

    if (res) {
      await fetchDatabase();
      setIsCreateOpen(false);
      setNewSeqName('');
      setNewSeqSteps([{ id: 's1', type: 'Email', delay: 'Day 1' }]);
    }
    
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Sequences</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your automated multi-step outreach campaigns.
          </p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-primary bg-accent hover:bg-accent-hover text-white border-transparent"
        >
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
        {filteredSequences.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-secondary bg-surface border border-dashed border-border rounded-lg">
            No sequences found. Create one to get started.
          </div>
        ) : null}

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
                  {seq.replied} <span className="text-xs text-text-tertiary font-normal">({Math.round((seq.replied / (seq.enrolled || 1)) * 100)}%)</span>
                </p>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Steps</p>
              <div className="space-y-3 flex-1">
                {(seq.steps || []).map((step: any, idx: number) => (
                  <div key={step.id || idx} className="flex items-center gap-3">
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

      {/* Create Sequence Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-[var(--surface-elevated)]">
              <h2 className="text-lg font-semibold text-text-primary">Create Sequence</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-text-tertiary hover:text-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Sequence Name</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="e.g. Senior Frontend Engineer Outreach"
                  value={newSeqName}
                  onChange={e => setNewSeqName(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-text-secondary">Sequence Steps</label>
                  <button onClick={handleAddStep} className="text-xs font-medium text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Step
                  </button>
                </div>
                
                <div className="space-y-3">
                  {newSeqSteps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-3 bg-[var(--surface-elevated)] p-3 rounded-lg border border-border">
                      <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-medium text-text-secondary shrink-0">
                        {idx + 1}
                      </div>
                      
                      <select 
                        className="input flex-1 py-1.5 px-3 text-sm h-9"
                        value={step.type}
                        onChange={e => handleUpdateStep(step.id, 'type', e.target.value)}
                      >
                        <option value="Email">Email</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Call">Call</option>
                        <option value="Manual Task">Manual Task</option>
                      </select>
                      
                      <input 
                        type="text" 
                        className="input w-24 py-1.5 px-3 text-sm h-9"
                        placeholder="Day 1"
                        value={step.delay}
                        onChange={e => handleUpdateStep(step.id, 'delay', e.target.value)}
                      />
                      
                      <button 
                        onClick={() => handleRemoveStep(step.id)}
                        disabled={newSeqSteps.length === 1}
                        className="p-2 text-text-tertiary hover:text-error transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-[var(--surface-elevated)] flex justify-end gap-3">
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateSequence}
                disabled={!newSeqName || isSaving}
                className="btn btn-primary bg-accent hover:bg-accent-hover text-white border-transparent disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Sequence'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
