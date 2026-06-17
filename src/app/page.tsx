'use client';

import { useState } from 'react';
import {
  Users,
  Briefcase,
  TrendingUp,
  Globe,
  Mail,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Phone,
  Calendar,
  Bell,
  Sparkles,
  Search,
  Workflow,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/store/app-store';
import {
  mockDailyActions,
  mockCandidates,
} from '@/lib/mock-data';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Growth trend data (Leads Sourced)
const sourcingTrend = [
  { month: 'Jan', leads: 400 },
  { month: 'Feb', leads: 850 },
  { month: 'Mar', leads: 1200 },
  { month: 'Apr', leads: 1800 },
  { month: 'May', leads: 2400 },
  { month: 'Jun', leads: 3200 },
];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Command Center</h1>
        <p className="text-sm text-text-secondary mt-1">
          Your active sourcing and outreach engine overview.
        </p>
      </div>

      {/* Quick Source Banner */}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Enrolled"
          value={430}
          icon={Users}
          trend={{ value: 45, direction: 'up' }}
          href="/sequences"
        />
        <KPICard
          label="Avg. Reply Rate"
          value="18%"
          icon={Mail}
          trend={{ value: 2.4, direction: 'up' }}
          href="/sequences"
        />
        <KPICard
          label="Active Sequences"
          value="3"
          icon={Workflow}
          href="/sequences"
        />
        <KPICard
          label="Interviews Booked"
          value="12"
          icon={Calendar}
          trend={{ value: 3, direction: 'up' }}
          href="/pipeline"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="card lg:col-span-2 flex flex-col min-h-[400px]">
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
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--text-tertiary)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="var(--text-tertiary)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    itemStyle={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLeads)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Active Sequences */}
        <div className="card flex flex-col">
          <div className="card-header border-b border-border">
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-accent" strokeWidth={1.75} />
              <h2 className="text-base font-semibold text-text-primary">Top Sequences</h2>
            </div>
            <Link href="/sequences" className="text-xs text-accent hover:text-accent-hover font-medium">View all</Link>
          </div>
          <div className="divide-y divide-border">
            <div className="p-4 hover:bg-[var(--surface-elevated)] transition-colors">
               <div className="flex justify-between items-start">
                 <div>
                   <h3 className="text-sm font-semibold text-text-primary">Senior Frontend Developer</h3>
                   <p className="text-xs text-text-secondary mt-0.5">3 steps • Active</p>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-semibold text-accent">19% Reply</p>
                   <p className="text-xs text-text-tertiary">42 Enrolled</p>
                 </div>
               </div>
            </div>
            <div className="p-4 hover:bg-[var(--surface-elevated)] transition-colors">
               <div className="flex justify-between items-start">
                 <div>
                   <h3 className="text-sm font-semibold text-text-primary">Executive VP Engineering</h3>
                   <p className="text-xs text-text-secondary mt-0.5">4 steps • Active</p>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-semibold text-accent">60% Reply</p>
                   <p className="text-xs text-text-tertiary">5 Enrolled</p>
                 </div>
               </div>
            </div>
            <div className="p-4 hover:bg-[var(--surface-elevated)] transition-colors">
               <div className="flex justify-between items-start">
                 <div>
                   <h3 className="text-sm font-semibold text-text-primary">Product Manager Warmup</h3>
                   <p className="text-xs text-text-secondary mt-0.5">2 steps • Paused</p>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-semibold text-text-secondary">0% Reply</p>
                   <p className="text-xs text-text-tertiary">15 Enrolled</p>
                 </div>
               </div>
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
