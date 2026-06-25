import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { Job } from '@/lib/schemas';

interface EditJobModalProps {
  job: Job;
  onClose: () => void;
  onSuccess: (updated: Job) => void;
}

export function EditJobModal({ job, onClose, onSuccess }: EditJobModalProps) {
  const [formData, setFormData] = useState({
    title: job.title || '',
    client: job.client || '',
    location: job.location || '',
    salaryMin: job.salaryMin || 0,
    salaryMax: job.salaryMax || 0,
    status: job.status || 'Open',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, ...formData }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update job');
      }

      onSuccess(data.data as Job);
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
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Edit Job</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && <div className="text-sm text-error bg-error/10 p-3 rounded-md">{error}</div>}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Job Title</label>
              <input required type="text" name="title" value={formData.title} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Client</label>
              <input required type="text" name="client" value={formData.client} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} className="input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Salary Min</label>
                <input type="number" name="salaryMin" value={formData.salaryMin} onChange={handleNumberChange} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Salary Max</label>
                <input type="number" name="salaryMax" value={formData.salaryMax} onChange={handleNumberChange} className="input" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="input">
                <option value="Open">Open</option>
                <option value="Sourcing">Sourcing</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Offer">Offer</option>
                <option value="Filled">Filled</option>
                <option value="On Hold">On Hold</option>
              </select>
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
