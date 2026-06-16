'use client';

import { useState } from 'react';
import {
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Phone,
  Calendar,
  Bell,
  Sparkles,
  Lightbulb,
  Target,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  mockDashboardStats,
  mockDailyActions,
  mockAIInsights,
  mockCandidates,
  mockPlacements,
  statusColors,
} from '@/lib/mock-data';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Revenue trend data
const revenueTrend = [
  { month: 'Jan', revenue: 18500 },
  { month: 'Feb', revenue: 24000 },
  { month: 'Mar', revenue: 21000 },
  { month: 'Apr', revenue: 31500 },
  { month: 'May', revenue: 24000 },
  { month: 'Jun', revenue: 29250 },
];

// Pipeline distribution
const pipelineData = [
  { name: 'New', value: 2, color: '#4F7BF7' },
  { name: 'Contacted', value: 2, color: '#9CA3AF' },
  { name: 'Engaged', value: 2, color: '#6395FF' },
  { name: 'Interview', value: 1, color: '#E5A50A' },
  { name: 'Submitted', value: 1, color: '#F59E0B' },
  { name: 'Placed', value: 1, color: '#22C55E' },
];

const priorityConfig = {
  high: { color: 'text-danger', bg: 'bg-danger-soft', label: 'High' },
  medium: { color: 'text-warning', bg: 'bg-warning-soft', label: 'Med' },
  low: { color: 'text-text-secondary', bg: 'bg-[var(--surface-elevated)]', label: 'Low' },
};

const actionIcons = {
  'follow-up': Clock,
  'contact': Phone,
  'interview': Calendar,
  'reminder': Bell,
};

const insightIcons = {
  suggestion: Lightbulb,
  alert: AlertTriangle,
  opportunity: Target,
};

const insightColors = {
  suggestion: 'text-accent',
  alert: 'text-warning',
  opportunity: 'text-success',
};

export default function DashboardPage() {
  const stats = mockDashboardStats;
  const [actionsFilter, setActionsFilter] = useState<'all' | 'high' | 'medium'>('all');

  const filteredActions =
    actionsFilter === 'all'
      ? mockDailyActions
      : mockDailyActions.filter((a) => a.priority === actionsFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Welcome back. Here&apos;s your recruitment overview for today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          label="Active Candidates"
          value={stats.activeCandidates}
          icon={Users}
          trend={{ value: 12, direction: 'up' }}
        />
        <KPICard
          label="Open Jobs"
          value={stats.activeJobs}
          icon={Briefcase}
          trend={{ value: 2, direction: 'up' }}
        />
        <KPICard
          label="Active Clients"
          value={stats.activeClients}
          icon={Building2}
        />
        <KPICard
          label="Placements (MTD)"
          value={stats.placementsThisMonth}
          icon={TrendingUp}
          trend={{ value: 1, direction: 'up' }}
        />
        <KPICard
          label="Revenue (MTD)"
          value={`$${(stats.revenueThisMonth / 1000).toFixed(1)}k`}
          icon={DollarSign}
          trend={{ value: 8, direction: 'up' }}
          isMoney
        />
        <KPICard
          label="Stalled"
          value={stats.stalledOpportunities}
          icon={AlertTriangle}
          trend={{ value: 1, direction: 'down' }}
          isAlert
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Actions — spans 2 cols */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Today&apos;s Actions</h2>
              <p className="text-xs text-text-secondary mt-0.5">{mockDailyActions.length} tasks pending</p>
            </div>
            <div className="flex gap-1">
              {(['all', 'high', 'medium'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActionsFilter(f)}
                  className={`btn-xs rounded-md text-xs font-medium px-2.5 py-1 transition-all ${
                    actionsFilter === f
                      ? 'bg-accent-soft text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-elevated)]'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'high' ? 'High' : 'Medium'}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            {filteredActions.map((action) => {
              const Icon = actionIcons[action.type];
              const priority = priorityConfig[action.priority];
              return (
                <div
                  key={action.id}
                  className="px-5 py-3.5 flex items-start gap-4 hover:bg-[var(--surface-elevated)] transition-colors group"
                >
                  <div className={`mt-0.5 p-1.5 rounded-md ${priority.bg}`}>
                    <Icon className={`w-4 h-4 ${priority.color}`} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{action.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5 truncate">{action.description}</p>
                  </div>
                  <span className={`badge ${priority.bg} ${priority.color} text-[10px]`}>
                    {priority.label}
                  </span>
                  <Link
                    href={`/${action.entityType}s/${action.entityId}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent-soft"
                  >
                    <ChevronRight className="w-4 h-4 text-accent" strokeWidth={1.75} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" strokeWidth={1.75} />
              <h2 className="text-base font-semibold text-text-primary">AI Insights</h2>
            </div>
          </div>
          <div className="divide-y divide-border">
            {mockAIInsights.map((insight) => {
              const Icon = insightIcons[insight.type];
              return (
                <div key={insight.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Icon
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${insightColors[insight.type]}`}
                      strokeWidth={1.75}
                    />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{insight.title}</p>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                  {insight.actionLabel && (
                    <Link
                      href={insight.actionUrl || '#'}
                      className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors ml-6"
                    >
                      {insight.actionLabel}
                      <ChevronRight className="w-3 h-3" strokeWidth={2} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h2 className="text-base font-semibold text-text-primary">Revenue Trend</h2>
            <span className="text-xs text-text-secondary">Last 6 months</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F7BF7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4F7BF7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }}
                  formatter={(value: unknown) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4F7BF7"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-base font-semibold text-text-primary">Pipeline Distribution</h2>
          </div>
          <div className="card-body flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 mt-2 w-full">
              {pipelineData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: item.color }}
                  />
                  <span className="text-[11px] text-text-secondary truncate">{item.name}</span>
                  <span className="text-[11px] font-mono font-medium text-text-primary ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-base font-semibold text-text-primary">Recent Placements</h2>
          <Link
            href="/placements"
            className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
          >
            View all
          </Link>
        </div>
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
              {mockPlacements.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">
                    <Link href={`/candidates/${p.candidateId}`} className="text-text-primary hover:text-accent transition-colors">
                      {p.candidateName}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/jobs/${p.jobId}`} className="text-text-secondary hover:text-accent transition-colors">
                      {p.jobTitle}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/clients/${p.clientId}`} className="text-text-secondary hover:text-accent transition-colors">
                      {p.clientName}
                    </Link>
                  </td>
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

// ========================================
// KPI Card Component
// ========================================
function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  isMoney,
  isAlert,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; direction: 'up' | 'down' };
  isMoney?: boolean;
  isAlert?: boolean;
}) {
  return (
    <div className="kpi-card group">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`p-2 rounded-md ${
            isAlert ? 'bg-warning-soft' : 'bg-accent-soft'
          }`}
        >
          <Icon
            className={`w-4 h-4 ${isAlert ? 'text-warning' : 'text-accent'}`}
            strokeWidth={1.75}
          />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${
              trend.direction === 'up' ? 'kpi-trend-up' : 'kpi-trend-down'
            }`}
          >
            {trend.direction === 'up' ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
