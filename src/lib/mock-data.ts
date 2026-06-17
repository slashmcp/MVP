import { Candidate, Job, Client, Placement, DashboardStats, DailyAction, AIInsight } from './schemas';

// ========================================
// Mock Candidates
// ========================================
export let mockCandidates: Candidate[] = [];

// ========================================
// Mock Jobs
// ========================================
export let mockJobs: Job[] = [
  {
    id: 'role-1',
    title: 'Role 1 (Placeholder)',
    client: 'Client Company',
    requirements: 'Enter requirements here...',
    location: 'Remote',
    salaryMin: 100000,
    salaryMax: 150000,
    status: 'Open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'role-2',
    title: 'Role 2 (Placeholder)',
    client: 'Client Company',
    requirements: 'Enter requirements here...',
    location: 'Remote',
    salaryMin: 100000,
    salaryMax: 150000,
    status: 'Open',
    createdAt: new Date().toISOString(),
  }
];

// ========================================
// Mock Clients
// ========================================
export let mockClients: Client[] = [
  {
    id: 'cl1',
    companyName: 'Client Company',
    contactPerson: 'Client Contact',
    email: 'contact@client.com',
    openRoles: 2,
    status: 'Active',
    notes: 'New client added via scraper integration.',
    createdAt: new Date().toISOString(),
  }
];

// ========================================
// Mock Placements
// ========================================
export let mockPlacements: Placement[] = [];

// ========================================
// Mock Dashboard Stats
// ========================================
export const mockDashboardStats: DashboardStats = {
  activeCandidates: 0,
  activeJobs: 2,
  activeClients: 1,
  placementsThisMonth: 0,
  revenueThisMonth: 0,
  stalledOpportunities: 0,
};

// ========================================
// Mock Daily Actions
// ========================================
export let mockDailyActions: DailyAction[] = [];

// ========================================
// Mock AI Insights
// ========================================
export let mockAIInsights: AIInsight[] = [];

// ========================================
// Pipeline stage definitions
// ========================================
export const candidatePipelineStages = [
  'New',
  'Contacted',
  'Engaged',
  'Interview',
  'Submitted',
  'Placed',
  'Rejected',
] as const;

export const jobPipelineStages = [
  'Open',
  'Sourcing',
  'Interviewing',
  'Offer',
  'Filled',
] as const;

// ========================================
// Status color mapping
// ========================================
export const statusColors: Record<string, string> = {
  // Candidate statuses
  'New': 'badge-blue',
  'Contacted': 'badge-neutral',
  'Engaged': 'badge-blue',
  'Interview': 'badge-amber',
  'Submitted': 'badge-amber',
  'Placed': 'badge-green',
  'Rejected': 'badge-red',
  // Job statuses
  'Open': 'badge-blue',
  'Sourcing': 'badge-amber',
  'Interviewing': 'badge-amber',
  'Offer': 'badge-green',
  'Filled': 'badge-green',
  // Client statuses
  'Active': 'badge-green',
  'Inactive': 'badge-neutral',
  'Prospect': 'badge-blue',
};

// ========================================
// Mock External Leads (Simulating Apollo.io / LinkedIn)
// ========================================
export const mockExternalLeads = [
  {
    id: 'ext_1',
    name: 'Eleanor Vance',
    email: 'eleanor.v@example.com',
    linkedinUrl: 'https://linkedin.com/in/eleanorv',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind'],
    seniority: 'Senior',
    source: 'LinkedIn Sourcing',
    notes: 'Strong frontend background, previously at Vercel.',
  },
  {
    id: 'ext_2',
    name: 'Marcus Thorne',
    email: 'm.thorne@example.com',
    linkedinUrl: 'https://linkedin.com/in/mthorne',
    skills: ['Python', 'Django', 'AWS', 'PostgreSQL'],
    seniority: 'Lead',
    source: 'Apollo.io',
    notes: 'Lead backend engineer at a fintech startup.',
  },
  {
    id: 'ext_3',
    name: 'Sophia Reynolds',
    email: 'sophia.r@example.com',
    linkedinUrl: 'https://linkedin.com/in/sophia-reynolds',
    skills: ['Figma', 'UI/UX', 'Design Systems', 'User Research'],
    seniority: 'Senior',
    source: 'Dribbble Scraping',
    notes: 'Incredible portfolio, heavily focused on SaaS dashboards.',
  },
  {
    id: 'ext_4',
    name: 'Julian Bates',
    email: 'jbates99@example.com',
    linkedinUrl: 'https://linkedin.com/in/julian-bates',
    skills: ['Go', 'Kubernetes', 'Terraform', 'GCP'],
    seniority: 'Staff',
    source: 'GitHub',
    notes: 'Active open-source contributor to container orchestration tools.',
  },
  {
    id: 'ext_5',
    name: 'Aria Chen',
    email: 'aria.chen.dev@example.com',
    linkedinUrl: 'https://linkedin.com/in/ariachen',
    skills: ['React Native', 'Swift', 'Kotlin', 'Mobile Arch'],
    seniority: 'Senior',
    source: 'LinkedIn Sourcing',
    notes: 'Built 3 top-100 apps in the App Store.',
  }
];
