'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import {
  Search,
  Plus,
  Filter,
  Mail,
  ExternalLink,
  ChevronDown,
  X,
  UploadCloud,
  FileText,
  Loader2,
  TableProperties,
} from 'lucide-react';
import { mockCandidates, statusColors, candidatePipelineStages } from '@/lib/mock-data';
import { Candidate } from '@/lib/schemas';
import { useAppStore } from '@/store/app-store';

export default function CandidatesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  const { showCredentialPrompt } = useAppStore();

  const filtered = useMemo(() => {
    return mockCandidates.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
        c.email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Candidates</h1>
          <p className="text-sm text-text-secondary mt-1">
            {mockCandidates.length} total &middot; {mockCandidates.filter((c) => c.status !== 'Rejected' && c.status !== 'Placed').length} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="btn btn-secondary"
            id="import-csv-btn"
          >
            <TableProperties className="w-4 h-4" strokeWidth={1.75} />
            Import CSV
          </button>
          <button
            onClick={() => showCredentialPrompt({ service: 'google-sheets', feature: 'Save New Candidate' })}
            className="btn btn-primary"
            id="add-candidate-btn"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            Add Candidate
          </button>
        </div>
      </div>

      {showAddModal && <AddCandidateModal onClose={() => setShowAddModal(false)} />}
      {showBulkImportModal && <BulkImportModal onClose={() => setShowBulkImportModal(false)} />}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Search by name, skill, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            id="candidate-search"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`btn-xs rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-accent-soft text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] border border-border'
            }`}
          >
            All
          </button>
          {candidatePipelineStages.map((stage) => (
            <button
              key={stage}
              onClick={() => setStatusFilter(stage)}
              className={`btn-xs rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === stage
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)] border border-border'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Skills</th>
                <th>Status</th>
                <th>Seniority</th>
                <th>Last Contact</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((candidate) => (
                <tr key={candidate.id}>
                  <td>
                    <Link
                      href={`/candidates/${candidate.id}`}
                      className="group"
                    >
                      <div className="font-medium text-text-primary group-hover:text-accent transition-colors">
                        {candidate.name}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {candidate.email}
                      </div>
                    </Link>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-[280px]">
                      {candidate.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="badge badge-neutral text-[10px]"
                        >
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 3 && (
                        <span className="text-[10px] text-text-tertiary">
                          +{candidate.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${statusColors[candidate.status] || 'badge-neutral'}`}>
                      {candidate.status}
                    </span>
                  </td>
                  <td className="text-text-secondary text-sm">
                    {candidate.seniority || '—'}
                  </td>
                  <td className="text-text-secondary font-mono text-xs">
                    {candidate.lastContactDate
                      ? new Date(candidate.lastContactDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/outreach?candidate=${candidate.id}`}
                        className="p-1.5 rounded-md text-text-tertiary hover:text-accent hover:bg-accent-soft transition-all"
                        title="Send email"
                      >
                        <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </Link>
                      {candidate.linkedinUrl && (
                        <a
                          href={candidate.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-text-tertiary hover:text-accent hover:bg-accent-soft transition-all"
                          title="LinkedIn"
                        >
                          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <Search className="w-10 h-10 mb-3 text-text-tertiary" strokeWidth={1.25} />
            <p className="text-sm font-medium">No candidates found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <AddCandidateModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

function AddCandidateModal({ onClose }: { onClose: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    skills: '',
    notes: '',
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setParseError('Please upload a valid PDF file.');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const data = new FormData();
      data.append('file', file);

      const response = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        throw new Error('Failed to parse resume');
      }

      const parsedData = await response.json();
      
      setFormData({
        name: parsedData.name || '',
        email: parsedData.email || '',
        phone: parsedData.phone || '',
        linkedinUrl: parsedData.linkedinUrl || '',
        skills: Array.isArray(parsedData.skills) ? parsedData.skills.join(', ') : '',
        notes: parsedData.notes || '',
      });
      
    } catch (err) {
      console.error(err);
      setParseError('Failed to parse resume. Please enter details manually.');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Add Candidate</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
        
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Drag & Drop Upload Zone */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Auto-fill with Resume (PDF)</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-6 transition-colors text-center cursor-pointer ${
                isDragging 
                  ? 'border-accent bg-accent/5' 
                  : 'border-border hover:border-accent/50 bg-[var(--surface-elevated)]'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="application/pdf" 
                className="hidden" 
              />
              
              {isParsing ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-text-primary">AI is analyzing resume...</p>
                  <p className="text-xs text-text-secondary">Extracting skills, experience, and contact info</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-1">
                    <UploadCloud className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Click to upload or drag and drop</p>
                  <p className="text-xs text-text-secondary">PDF files only (Max 5MB)</p>
                </div>
              )}
            </div>
            {parseError && (
              <p className="text-xs text-error mt-2">{parseError}</p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-surface text-xs text-text-tertiary">Or enter manually</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" placeholder="e.g. Jane Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" placeholder="jane@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">LinkedIn URL</label>
              <input type="url" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className="input" placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Skills (comma separated)</label>
              <input type="text" name="skills" value={formData.skills} onChange={handleChange} className="input" placeholder="React, TypeScript, Node.js" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Notes (AI Summary)</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="input min-h-[80px] resize-none" placeholder="Any relevant notes..." />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-[var(--surface-elevated)]">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button className="btn btn-primary" disabled={isParsing}>
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            Save Candidate
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkImportModal({ onClose }: { onClose: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isMapping, setIsMapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappedData, setMappedData] = useState<any[] | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [mappingResult, setMappingResult] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useAppStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processCsv(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processCsv(e.target.files[0]);
    }
  };

  const processCsv = async (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    setIsMapping(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as Record<string, string>[];
        if (data.length === 0) {
          setError('CSV file is empty.');
          setIsMapping(false);
          return;
        }

        const headers = results.meta.fields || [];
        setRawHeaders(headers);

        const sampleRows = data.slice(0, 3);

        try {
          const response = await fetch('/api/ai/map-csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ headers, sampleRows }),
          });

          if (!response.ok) {
            throw new Error('Failed to map CSV headers');
          }

          const mapping = await response.json();
          setMappingResult(mapping);

          // Apply mapping
          const mapped = data.map((row) => {
            const newRow: any = {
              name: '',
              email: '',
              phone: '',
              linkedinUrl: '',
              skills: '',
              notes: '',
              status: 'New',
            };

            for (const [originalHeader, value] of Object.entries(row)) {
              const mappedField = mapping[originalHeader];
              if (mappedField && newRow[mappedField] !== undefined) {
                if (newRow[mappedField] === '') {
                  newRow[mappedField] = value;
                } else {
                  // Append if multiple map to the same field (e.g. notes)
                  newRow[mappedField] += `\n${originalHeader}: ${value}`;
                }
              }
            }

            // Ensure skills is an array for display if we wanted to, but keeping string is easier here
            if (newRow.skills && typeof newRow.skills === 'string') {
               newRow.skills = newRow.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
            } else {
               newRow.skills = [];
            }

            return newRow;
          });

          setMappedData(mapped);
        } catch (err) {
          console.error(err);
          setError('Failed to process CSV with AI. Please check your API key.');
        } finally {
          setIsMapping(false);
        }
      },
      error: (err) => {
        console.error(err);
        setError('Error parsing CSV file.');
        setIsMapping(false);
      }
    });
  };

  const confirmImport = () => {
    addToast({
      type: 'success',
      message: `Successfully imported ${mappedData?.length || 0} candidates from CSV!`
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Bulk Import Candidates</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
        
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {!mappedData ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-text-secondary">Upload a CSV file. Our AI will automatically map your columns to the correct fields.</label>
              <div 
                className={`border-2 border-dashed rounded-xl p-10 transition-colors text-center cursor-pointer ${
                  isDragging 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:border-accent/50 bg-[var(--surface-elevated)]'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".csv" 
                  className="hidden" 
                />
                
                {isMapping ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-3">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-text-primary">AI is analyzing CSV structure...</p>
                    <p className="text-xs text-text-secondary">Mapping custom columns to schema</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-2">
                      <TableProperties className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium text-text-primary">Click to upload or drag and drop</p>
                    <p className="text-xs text-text-secondary">CSV files only</p>
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-error mt-2">{error}</p>}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-[var(--surface-elevated)] border border-border rounded-lg p-4">
                <h4 className="text-sm font-semibold text-text-primary mb-2">AI Column Mapping Results</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(mappingResult).map(([orig, mapped]) => (
                    <div key={orig} className="flex items-center gap-2 text-xs bg-surface border border-border px-2 py-1 rounded-md">
                      <span className="text-text-secondary line-clamp-1 max-w-[120px]" title={orig}>{orig}</span>
                      <span className="text-text-tertiary">→</span>
                      <span className="text-accent font-medium">{mapped}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-3">Preview ({mappedData.length} records found)</h4>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--surface-elevated)] border-b border-border text-xs text-text-secondary">
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Name</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Email</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Phone</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Skills</th>
                        <th className="px-4 py-3 font-medium">Notes Preview</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappedData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-[var(--surface-elevated)] transition-colors">
                          <td className="px-4 py-3 text-sm text-text-primary font-medium whitespace-nowrap">{row.name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">{row.email || '-'}</td>
                          <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">{row.phone || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {row.skills.slice(0, 2).map((s: string) => (
                                <span key={s} className="badge badge-accent text-[10px] px-1.5">{s}</span>
                              ))}
                              {row.skills.length > 2 && <span className="text-xs text-text-tertiary">+{row.skills.length - 2}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-text-secondary line-clamp-2 max-w-[200px]">
                            {row.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {mappedData.length > 5 && (
                  <p className="text-xs text-text-tertiary text-center mt-3">Showing 5 of {mappedData.length} records</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-[var(--surface-elevated)]">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          {mappedData && (
            <button className="btn btn-primary" onClick={confirmImport}>
              <TableProperties className="w-4 h-4" strokeWidth={1.75} />
              Confirm Import
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
