
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { X, Loader2, TableProperties } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

export function BulkImportModal({ onClose }: { onClose: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isMapping, setIsMapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappedData, setMappedData] = useState<any[] | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [mappingResult, setMappingResult] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast, fetchDatabase } = useAppStore();

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

  const confirmImport = async () => {
    if (!mappedData || mappedData.length === 0) return;
    
    setIsImporting(true);
    setError(null);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const candidate of mappedData) {
        const payload = {
          name: candidate.name || 'Unknown',
          email: candidate.email || 'N/A',
          phone: candidate.phone || 'N/A',
          location: candidate.location || 'N/A',
          role: candidate.role || candidate.seniority || 'Candidate',
          company: candidate.company || 'Unknown',
          status: candidate.status || 'New',
          source: 'CSV Import',
          rating: 3,
          skills: candidate.skills || [],
          experience: candidate.experience || 'Not specified',
          seniority: candidate.seniority || 'Mid/Senior',
          linkedinUrl: candidate.linkedinUrl || '',
          websiteUrl: candidate.websiteUrl || '',
          notes: candidate.notes || ''
        };

        const res = await fetch('/api/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        addToast({
          type: 'success',
          message: `Successfully imported ${successCount} candidates!`
        });
        await fetchDatabase();
      }
      
      if (errorCount > 0) {
        addToast({
          type: 'error',
          message: `Failed to import ${errorCount} candidates.`
        });
      }

      onClose();
    } catch (e) {
      console.error('Import failed', e);
      setError('An error occurred during import.');
    } finally {
      setIsImporting(false);
    }
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
            <button className="btn btn-primary" onClick={confirmImport} disabled={isImporting}>
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TableProperties className="w-4 h-4" strokeWidth={1.75} />}
              {isImporting ? 'Importing...' : 'Confirm Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
