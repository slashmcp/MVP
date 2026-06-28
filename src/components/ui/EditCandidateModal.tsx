import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import type { Candidate } from '@/lib/schemas';

interface EditCandidateModalProps {
  candidate: Candidate;
  onClose: () => void;
  onSuccess: (updated: Candidate) => void;
}

export function EditCandidateModal({ candidate, onClose, onSuccess }: EditCandidateModalProps) {
  const [formData, setFormData] = useState({
    name: candidate.name || '',
    email: candidate.email || '',
    phone: candidate.phone || '',
    location: candidate.location || '',
    seniority: candidate.seniority || '',
    linkedinUrl: candidate.linkedinUrl || '',
    websiteUrl: candidate.websiteUrl || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: candidate.id, ...formData }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update candidate');
      }

      onSuccess(data.data as Candidate);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Edit Candidate</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {error && <div className="text-sm text-error bg-error/10 p-3 rounded-md">{error}</div>}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
                <input type="text" name="email" value={formData.email} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Seniority</label>
                <input type="text" name="seniority" value={formData.seniority} onChange={handleChange} className="input" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">LinkedIn URL</label>
              <input type="url" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Website / Portfolio URL</label>
              <input type="url" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className="input" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-[var(--surface-elevated)]">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
