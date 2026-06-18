'use client';

import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

export default function PlacementsPage() {
  const placements: any[] = [];
  const totalRevenue = placements.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Placements</h1>
        <p className="text-sm text-text-secondary mt-1">
          {placements.length} total placements
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-md bg-success-soft">
              <TrendingUp className="w-4 h-4 text-success" strokeWidth={1.75} />
            </div>
          </div>
          <div className="kpi-value">{placements.length}</div>
          <div className="kpi-label">Total Placements</div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-md bg-accent-soft">
              <DollarSign className="w-4 h-4 text-accent" strokeWidth={1.75} />
            </div>
          </div>
          <div className="kpi-value">${(totalRevenue / 1000).toFixed(1)}k</div>
          <div className="kpi-label">Total Revenue</div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-md bg-warning-soft">
              <DollarSign className="w-4 h-4 text-warning" strokeWidth={1.75} />
            </div>
          </div>
          <div className="kpi-value">${(totalRevenue / (placements.length || 1) / 1000).toFixed(1)}k</div>
          <div className="kpi-label">Avg Revenue / Placement</div>
        </div>
      </div>

      {/* Placements table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Position</th>
                <th>Client</th>
                <th>Date</th>
                <th className="text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {placements.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium text-text-primary">{p.candidateName}</td>
                  <td className="text-text-secondary">{p.jobTitle}</td>
                  <td className="text-text-secondary">{p.clientName}</td>
                  <td className="text-text-secondary font-mono text-xs">
                    {new Date(p.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="text-right font-mono font-medium text-success">
                    ${p.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
