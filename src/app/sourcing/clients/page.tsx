'use client';

import { useState } from 'react';
import { Search, Building2, Briefcase, Plus, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

type ScrapedJob = {
  title: string;
  salaryRange: string;
  description: string;
};

type ScrapedCompany = {
  companyName: string;
  websiteUrl: string;
  industry: string;
  location: string;
  description: string;
  openRoles: ScrapedJob[];
};

const ensureAbsoluteUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export default function ClientSourcingPage() {
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<ScrapedCompany[]>([]);
  const { addToast, fetchDatabase } = useAppStore();

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !location) {
      addToast({ type: 'error', message: 'Category and Location are required.' });
      return;
    }

    setIsScraping(true);
    setResults([]);
    try {
      const res = await fetch('/api/sourcing/scrape-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, location, companyName })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to scrape');
      
      setResults(data.data);
      addToast({ type: 'success', message: `Found ${data.data.length} companies matching your criteria!` });
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', message: err.message || 'An error occurred during scraping.' });
    } finally {
      setIsScraping(false);
    }
  };

  const importCompany = async (company: ScrapedCompany) => {
    try {
      // 1. Create Client
      const clientPayload = {
        companyName: company.companyName,
        industry: company.industry,
        location: company.location,
        websiteUrl: company.websiteUrl,
        notes: company.description,
        status: 'Active',
      };
      
      const clientRes = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientPayload)
      });
      const clientData = await clientRes.json();
      
      if (!clientRes.ok) throw new Error('Failed to create client');
      const clientId = clientData.id;

      // 2. Create Jobs
      for (const role of company.openRoles) {
        const jobPayload = {
          clientId,
          title: role.title,
          location: company.location,
          type: 'Full-time',
          salaryRange: role.salaryRange,
          description: role.description,
          status: 'Open',
          priority: 'Medium',
        };
        await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jobPayload)
        });
      }

      addToast({ type: 'success', message: `Successfully imported ${company.companyName} and ${company.openRoles.length} open roles to CRM!` });
      
      // Remove from results so user knows it's imported
      setResults(prev => prev.filter(c => c.companyName !== company.companyName));
      await fetchDatabase();
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', message: 'Failed to import company to CRM.' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Company & Job Sourcing</h1>
        <p className="text-sm text-text-secondary mt-1">
          Scrape local directories to discover companies and extract their open roles directly into your CRM.
        </p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleScrape} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-sm font-medium text-text-primary">Category / Industry *</label>
            <input 
              type="text" 
              placeholder="e.g. Fintech, Design Agencies" 
              className="input w-full"
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-sm font-medium text-text-primary">Location *</label>
            <input 
              type="text" 
              placeholder="e.g. Glasgow, UK" 
              className="input w-full"
              value={location}
              onChange={e => setLocation(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-sm font-medium text-text-primary">Company Name (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. TechStart" 
              className="input w-full"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <button 
              type="submit" 
              className="btn btn-primary w-full flex items-center justify-center gap-2"
              disabled={isScraping}
            >
              {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isScraping ? 'Scraping Web...' : 'Start Search'}
            </button>
          </div>
        </form>
      </div>

      {results.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">Results ({results.length} found)</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((company, idx) => (
              <div key={idx} className="card p-5 hover:border-accent/30 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">{company.companyName}</h3>
                        <a href={ensureAbsoluteUrl(company.websiteUrl)} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                          {company.websiteUrl}
                        </a>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mb-4 line-clamp-2">{company.description}</p>
                  
                  <div className="bg-[var(--surface-elevated)] border border-border rounded-lg p-3 mb-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Open Roles Found ({company.openRoles.length})
                    </h4>
                    <div className="space-y-2">
                      {company.openRoles.map((role, i) => (
                        <div key={i} className="flex items-start justify-between text-sm">
                          <span className="font-medium text-text-primary">{role.title}</span>
                          <span className="text-text-secondary">{role.salaryRange}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => importCompany(company)}
                  className="btn btn-secondary w-full flex items-center justify-center gap-2 border-accent/20 hover:bg-accent hover:text-white transition-all text-accent"
                >
                  <Plus className="w-4 h-4" />
                  Import to CRM
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
