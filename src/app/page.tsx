'use client';

import { useState } from 'react';
import {
  Users,
  Briefcase,
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
  Search,
  Workflow,
  Globe,
  Mail,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/store/app-store';
import {
  mockDashboardStats,
  mockDailyActions,
  mockAIInsights,
  mockCandidates,
  mockJobs,
  mockClients,
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

// Growth trend data (Leads Sourced)
const sourcingTrend = [
  { month: 'Jan', leads: 400 },
  { month: 'Feb', leads: 850 },
  { month: 'Mar', leads: 1200 },
  { month: 'Apr', leads: 1800 },
  { month: 'May', leads: 2400 },
  { month: 'Jun', leads: 3200 },
];

const pipelineData: { name: string; value: number; color: string }[] = [];

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
  const { hiddenCandidateIds, hiddenJobIds, hiddenClientIds } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const stats = {
    ...mockDashboardStats,
    activeCandidates: mockCandidates.filter(c => !hiddenCandidateIds.includes(c.id) && c.status !== 'Rejected' && c.status !== 'Placed').length,
    activeJobs: mockJobs.filter(j => !hiddenJobIds.includes(j.id) && j.status === 'Open').length,
    activeClients: mockClients.filter(c => !hiddenClientIds.includes(c.id) && c.status === 'Active').length,
  };
  
  const [actionsFilter, setActionsFilter] = useState<'all' | 'high' | 'medium'>('all');

  const filteredActions =
    actionsFilter === 'all'
      ? mockDailyActions
      : mockDailyActions.filter((a) => a.priority === actionsFilter);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Command Center</h1>
        <p className="text-sm text-text-secondary mt-1">
          Your unified recruitment and sourcing overview.
        </p>
      </div>

      {/* Quick Source Banner (The New V2 Focus) */}
      <div className="card bg-accent-soft border border-accent/20 overflow-hidden relative">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="p-6 relative z-10 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 space-y-3">
            <h2 className="text-lg font-semibold text-accent flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Sourcing Engine
            </h2>
            <p className="text-sm text-text-secondary max-w-lg">
              Paste a Job Description or enter a role title. The AI will instantly scrape Apollo and Apify to find the top 50 matches.
            </p>
            <div className="relative max-w-xl flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input 
                  type="text" 
                  className="input pl-10 w-full bg-surface border-border focus:border-accent/50" 
                  placeholder="e.g. Senior Frontend Engineer with Next.js..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Link href="/jobs" className="btn btn-primary bg-accent hover:bg-accent-hover text-white border-transparent shadow-accent/25 shrink-0">
                Start Sourcing
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex gap-4">
            <div className="bg-surface p-4 rounded-lg border border-border min-w-[140px]">
              <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Leads Found</p>
              <p className="text-2xl font-bold text-text-primary mt-1">3,204</p>
              <p className="text-xs text-success mt-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> +12% this week</p>
            </div>
            <div className="bg-surface p-4 rounded-lg border border-border min-w-[140px]">
              <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">AI Screened</p>
              <p className="text-2xl font-bold text-text-primary mt-1">2,890</p>
              <p className="text-xs text-success mt-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> 90% accuracy</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards (Best of Both Worlds) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* Row 1: Sourcing & Sequences */}
        <KPICard label="Total Enrolled" value={430} icon={Globe} trend={{ value: 45, direction: 'up' }} href="/sequences" />
        <KPICard label="Avg. Reply Rate" value="18%" icon={Mail} trend={{ value: 2.4, direction: 'up' }} href="/sequences" />
        <KPICard label="Active Sequences" value="3" icon={Workflow} href="/sequences" />
        <KPICard label="Interviews Booked" value="12" icon={Calendar} trend={{ value: 3, direction: 'up' }} href="/pipeline" />
        
        {/* Row 2: Legacy ATS / Tracking KPIs */}
        <KPICard label="Active Candidates" value={stats.activeCandidates} icon={Users} trend={{ value: 12, direction: 'up' }} href="/candidates" />
        <KPICard label="Open Jobs" value={stats.activeJobs} icon={Briefcase} trend={{ value: 2, direction: 'up' }} href="/jobs" />
        <KPICard label="Placements (MTD)" value={stats.placementsThisMonth} icon={TrendingUp} trend={{ value: 1, direction: 'up' }} href="/placements" />
        <KPICard label="Revenue (MTD)" value={`$${(stats.revenueThisMonth / 1000).toFixed(1)}k`} icon={DollarSign} trend={{ value: 8, direction: 'up' }} isMoney href="/placements" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Stats & Actions) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sourcing Trend Chart */}
          <div className="card flex flex-col min-h-[400px]">
            <div className="card-header border-b border-border">
              <h2 className="text-base font-semibold text-text-primary">Sourcing Volume Trend</h2>
            </div>
            <div className="card-body flex-1 p-6">
              <div className="h-full min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sourcingTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }} />
                    <Area type="monotone" dataKey="leads" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Legacy Next Actions */}
          <div className="card">
            <div className="card-header border-b border-border">
              <h2 className="text-base font-semibold text-text-primary">Next Actions</h2>
              <div className="flex gap-1.5">
                {['all', 'high', 'medium'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActionsFilter(f as any)}
                    className={`btn-xs rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                      actionsFilter === f
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-text-secondary hover:bg-[var(--surface-elevated)] border border-transparent'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-border">
              {filteredActions.map((action) => {
                const ActionIcon = actionIcons[action.type];
                const priority = priorityConfig[action.priority];
                return (
                  <div
                    key={action.id}
                    className="p-4 hover:bg-[var(--surface-elevated)] transition-colors flex items-start gap-4 group"
                  >
                    <div className="mt-1 bg-surface border border-border p-2 rounded-lg text-text-tertiary group-hover:text-accent group-hover:border-accent/30 transition-colors">
                      <ActionIcon className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="text-sm font-semibold text-text-primary truncate">
                          {action.title}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`badge ${priority.bg} ${priority.color} text-[10px]`}>
                            {priority.label}
                          </span>
                          <span className="text-xs text-text-tertiary font-mono whitespace-nowrap">
                            {new Date(action.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (Insights & Sequences) */}
        <div className="space-y-6">
          {/* Top Sequences Live Feed */}
          <div className="card flex flex-col">
            <div className="card-header border-b border-border">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-accent" strokeWidth={1.75} />
                <h2 className="text-base font-semibold text-text-primary">Top Sequences</h2>
              </div>
              <Link href="/sequences" className="text-xs text-accent hover:text-accent-hover font-medium">View all</Link>
            </div>
            <div className="divide-y divide-border">
              <div className="p-8 text-center flex flex-col items-center justify-center text-text-tertiary">
                <Workflow className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium text-text-secondary">No active sequences</p>
                <p className="text-xs mt-1">Start an outreach campaign to see live results here.</p>
              </div>
            </div>
          </div>

          {/* Pipeline Distribution */}
          <div className="card">
            <div className="card-header border-b border-border">
              <h2 className="text-base font-semibold text-text-primary">Candidate Pipeline</h2>
            </div>
            <div className="card-body p-4 h-[240px] flex items-center justify-center relative">
              {pipelineData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pipelineData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {pipelineData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--surface-elevated)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                        itemStyle={{ color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-text-primary">{pipelineData.reduce((a, b) => a + b.value, 0)}</span>
                    <span className="text-xs text-text-secondary">Total Active</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-text-tertiary h-full">
                  <Target className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium text-text-secondary">Empty Pipeline</p>
                  <p className="text-xs mt-1 text-center px-4">Find candidates to build your pipeline.</p>
                </div>
              )}
            </div>
          </div>

          {/* Legacy AI Insights */}
          <div className="card">
            <div className="card-header border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" strokeWidth={1.75} />
                <h2 className="text-base font-semibold text-text-primary">AI Insights</h2>
              </div>
            </div>
            <div className="divide-y divide-border">
              {mockAIInsights.slice(0, 3).map((insight) => {
                const InsightIcon = insightIcons[insight.type];
                const colorClass = insightColors[insight.type];
                return (
                  <div key={insight.id} className="p-4 hover:bg-[var(--surface-elevated)] transition-colors group">
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`mt-0.5 ${colorClass}`}>
                        <InsightIcon className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                        {insight.title}
                      </h3>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed pl-7">
                      {insight.description}
                    </p>
                    {insight.actionLabel && (
                      <div className="pl-7 mt-3">
                        <Link
                          href={insight.actionUrl || '#'}
                          className="inline-flex items-center gap-1 text-xs font-medium text-text-primary hover:text-accent transition-colors"
                        >
                          {insight.actionLabel}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  isMoney,
  isAlert,
  href,
}: {
  label: string;
  value: string | number;
  icon: any;
  trend?: { value: number; direction: 'up' | 'down' };
  isMoney?: boolean;
  isAlert?: boolean;
  href?: string;
}) {
  const CardWrapper = href ? Link : 'div';
  
  return (
    <CardWrapper 
      href={href || ''} 
      className={`card p-5 group ${href ? 'hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">{label}</p>
          <h3 className={`text-2xl font-bold mt-1 ${isAlert ? 'text-warning' : 'text-text-primary'}`}>
            {value}
          </h3>
        </div>
        <div className={`p-2 rounded-lg ${isAlert ? 'bg-warning-soft text-warning' : 'bg-accent-soft text-accent'}`}>
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          <span
            className={`flex items-center font-medium ${
              trend.direction === 'up' ? 'text-success' : 'text-danger'
            }`}
          >
            {trend.direction === 'up' ? (
              <ArrowUpRight className="w-4 h-4 mr-0.5" strokeWidth={2} />
            ) : (
              <ArrowDownRight className="w-4 h-4 mr-0.5" strokeWidth={2} />
            )}
            {isMoney ? '$' : ''}{trend.value}{isMoney ? 'k' : '%'}
          </span>
          <span className="text-text-tertiary">vs last month</span>
        </div>
      )}
    </CardWrapper>
  );
}
