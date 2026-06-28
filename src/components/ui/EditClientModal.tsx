import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { Client } from '@/lib/schemas';

interface EditClientModalProps {
  client: Client;
  onClose: () => void;
  onSuccess: (updated: Client) => void;
}

export function EditClientModal({ client, onClose, onSuccess }: EditClientModalProps) {
  const [formData, setFormData] = useState({
    companyName: client.companyName || '',
    location: client.location || '',
    contactPerson: client.contactPerson || '',
    email: client.email || '',
    industry: client.industry || '',
    phone: client.phone || '',
    websiteUrl: client.websiteUrl || '',
    linkedinUrl: client.linkedinUrl || '',
    googleRating: client.googleRating || '',
    reviewCount: client.reviewCount || '',
    instagramUrl: client.instagramUrl || '',
    facebookUrl: client.facebookUrl || '',
    twitterUrl: client.twitterUrl || '',
    youtubeUrl: client.youtubeUrl || '',
    mapsUrl: client.mapsUrl || '',
    status: client.status || 'Active',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: client.id, ...formData }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update client');
      }

      onSuccess(data.data as Client);
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
          <h3 className="text-lg font-semibold text-text-primary">Edit Client</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-[var(--surface-elevated)] transition-all"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
            {error && <div className="text-sm text-error bg-error/10 p-3 rounded-md">{error}</div>}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Company Name</label>
              <input required type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Location / City</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} className="input" placeholder="e.g. Edinburgh, Scotland" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Contact Person</label>
              <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
              <input type="text" name="email" value={formData.email} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input" placeholder="e.g. (515) 555-0199" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Website URL</label>
              <input type="text" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className="input" placeholder="e.g. https://example.com" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Business Category</label>
              <input type="text" name="industry" value={formData.industry} onChange={handleChange} className="input" placeholder="e.g. Technology, Retail" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">LinkedIn Profile URL</label>
              <input type="text" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className="input" placeholder="e.g. https://linkedin.com/company/example" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Google Rating</label>
                <input type="number" step="0.1" max="5" min="0" name="googleRating" value={formData.googleRating} onChange={handleChange} className="input" placeholder="e.g. 4.8" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Review Count</label>
                <input type="number" min="0" name="reviewCount" value={formData.reviewCount} onChange={handleChange} className="input" placeholder="e.g. 150" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Google Maps URL</label>
              <input type="text" name="mapsUrl" value={formData.mapsUrl} onChange={handleChange} className="input" placeholder="e.g. https://maps.google.com/..." />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Instagram URL</label>
              <input type="text" name="instagramUrl" value={formData.instagramUrl} onChange={handleChange} className="input" placeholder="e.g. https://instagram.com/..." />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Facebook URL</label>
              <input type="text" name="facebookUrl" value={formData.facebookUrl} onChange={handleChange} className="input" placeholder="e.g. https://facebook.com/..." />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Twitter / X URL</label>
              <input type="text" name="twitterUrl" value={formData.twitterUrl} onChange={handleChange} className="input" placeholder="e.g. https://twitter.com/..." />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">YouTube URL</label>
              <input type="text" name="youtubeUrl" value={formData.youtubeUrl} onChange={handleChange} className="input" placeholder="e.g. https://youtube.com/..." />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="input">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Prospect">Prospect</option>
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

