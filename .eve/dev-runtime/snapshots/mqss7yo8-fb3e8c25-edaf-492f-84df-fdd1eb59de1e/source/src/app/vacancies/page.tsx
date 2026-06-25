'use client';

import { useState } from 'react';
import { Search, MapPin, Building2, ExternalLink, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';

export default function VacanciesPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [savingJobs, setSavingJobs] = useState<Record<string, boolean>>({});
  const [savedJobs, setSavedJobs] = useState<Record<string, boolean>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const fullQuery = location ? `${query} in ${location}` : query;
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullQuery }),
      });

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error(error);
      alert('Failed to fetch vacancies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLead = async (job: any, index: number) => {
    const key = `${index}-${job.title}`;
    setSavingJobs(prev => ({ ...prev, [key]: true }));

    try {
      const res = await fetch('/api/leads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: job.company_name,
          location: job.location,
          jobTitle: job.title,
          description: job.description,
        }),
      });

      if (!res.ok) throw new Error('Failed to save lead');
      setSavedJobs(prev => ({ ...prev, [key]: true }));
    } catch (error) {
      console.error(error);
      alert('Failed to add to CRM. Please try again.');
    } finally {
      setSavingJobs(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Find Vacancies</h1>
        <p className="text-text-secondary text-lg">
          Actively search for open job postings to identify companies hiring in your target market.
        </p>
      </div>

      <div className="bg-[var(--surface-elevated)] border border-border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Job title, keywords, or company (e.g. React Developer)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[var(--surface-overlay)] border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50"
              required
            />
          </div>
          <div className="md:w-1/3 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Location (e.g. Glasgow)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[var(--surface-overlay)] border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <button type="submit" disabled={isLoading || !query} className="py-3 px-8 h-auto font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Searching
              </>
            ) : (
              'Search Vacancies'
            )}
          </button>
        </form>
      </div>

      {hasSearched && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">
            {jobs.length > 0 ? `Found ${jobs.length} Active Vacancies` : isLoading ? 'Searching...' : 'No vacancies found'}
          </h2>

          <div className="grid gap-4">
            {jobs.map((job, index) => {
              const key = `${index}-${job.title}`;
              const isSaving = savingJobs[key];
              const isSaved = savedJobs[key];
              
              return (
                <div key={index} className="bg-[var(--surface-overlay)] border border-border rounded-xl p-6 hover:border-accent/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-text-primary mb-1">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary mb-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4" />
                          <span className="font-medium">{job.company_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-3 mb-4">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button 
                        onClick={() => handleSaveLead(job, index)}
                        disabled={isSaving || isSaved}
                        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors px-4 py-2 border ${
                          isSaved 
                            ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                            : 'bg-[var(--surface-elevated)] hover:bg-accent/10 hover:text-accent border-border text-text-primary'
                        } disabled:opacity-50 disabled:cursor-not-allowed gap-2`}
                      >
                        {isSaving ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : isSaved ? (
                          <><CheckCircle2 className="w-4 h-4" /> Added to CRM</>
                        ) : (
                          <><UserPlus className="w-4 h-4" /> Save as Lead</>
                        )}
                      </button>
                    </div>
                  </div>

                  {job.apply_options && job.apply_options.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                      {job.apply_options.map((option: any, idx: number) => (
                        <a
                          key={idx}
                          href={option.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors bg-[var(--surface-elevated)] hover:bg-accent/10 hover:text-accent border border-border px-3 py-1.5 h-8 gap-1.5"
                        >
                          {option.title}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
