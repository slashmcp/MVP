import { z } from 'zod';

// ========================================
// Candidate Schema
// ========================================
export const candidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  resume: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  role: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  rating: z.number().optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).default([]),
  status: z.enum([
    'New',
    'Contacted',
    'Engaged',
    'Interview',
    'Submitted',
    'Placed',
    'Rejected',
  ]).default('New'),
  notes: z.string().optional(),
  lastContact: z.string().optional(),
  lastContactDate: z.string().optional(),
  seniority: z.string().optional(),
  aiFitScore: z.number().optional(),
  source: z.string().optional(),
  sequenceId: z.string().optional(),
  sequenceStatus: z.enum(['Unenrolled', 'Active', 'Completed', 'Replied']).optional(),
  createdAt: z.string().optional(),
});

export type Candidate = z.infer<typeof candidateSchema>;

// ========================================
// Job Schema
// ========================================
export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  client: z.string(),
  clientId: z.string().optional(),
  requirements: z.union([z.string(), z.array(z.string())]).optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  salary: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  status: z.enum([
    'Open',
    'Sourcing',
    'Interviewing',
    'Offer',
    'Filled',
  ]).default('Open'),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  postedDate: z.string().optional(),
  applicants: z.number().optional(),
  createdAt: z.string().optional(),
});

export type Job = z.infer<typeof jobSchema>;

// ========================================
// Client Schema
// ========================================
export const clientSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  industry: z.string().optional(),
  location: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  openRoles: z.number().default(0),
  totalPlacements: z.number().optional(),
  status: z.enum(['Active', 'Inactive', 'Prospect']).default('Active'),
  activeSince: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
});

export type Client = z.infer<typeof clientSchema>;

// ========================================
// Placement Schema
// ========================================
export const placementSchema = z.object({
  id: z.string(),
  candidateId: z.string(),
  candidateName: z.string(),
  jobId: z.string(),
  jobTitle: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  date: z.string(),
  revenue: z.number().default(0),
  createdAt: z.string().optional(),
});

export type Placement = z.infer<typeof placementSchema>;

// ========================================
// Outreach Log Schema
// ========================================
export const outreachLogSchema = z.object({
  id: z.string(),
  candidateId: z.string().optional(),
  clientId: z.string().optional(),
  type: z.enum(['Outreach', 'Follow-up', 'Interview Invite', 'Client Update']),
  subject: z.string(),
  body: z.string(),
  sentAt: z.string().optional(),
  status: z.enum(['Draft', 'Sent', 'Opened', 'Replied']).default('Draft'),
});

export type OutreachLog = z.infer<typeof outreachLogSchema>;

// ========================================
// AI Match Result
// ========================================
export interface MatchResult {
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  fitScore: number;
  reasoning: string;
  strengths: string[];
  gaps: string[];
}

// ========================================
// Dashboard Types
// ========================================
export interface DashboardStats {
  activeCandidates: number;
  activeJobs: number;
  activeClients: number;
  placementsThisMonth: number;
  revenueThisMonth: number;
  stalledOpportunities: number;
}

export interface DailyAction {
  id: string;
  type: 'follow-up' | 'contact' | 'reminder' | 'interview';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  entityType: 'candidate' | 'client' | 'job';
  entityId: string;
}

export interface AIInsight {
  id: string;
  type: 'suggestion' | 'alert' | 'opportunity';
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
}

// ========================================
// Sequence Schema
// ========================================
export interface SequenceStep {
  id: string;
  type: 'Email' | 'LinkedIn' | 'Call' | string;
  delay: string;
  content?: string;
}

export interface Sequence {
  id: string;
  name: string;
  status: string;
  enrolled: number;
  replied: number;
  bounced: number;
  steps: SequenceStep[];
  createdAt?: string;
}
