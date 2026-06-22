import { Candidate, Job, Client, Placement, DashboardStats, DailyAction, AIInsight, OutreachLog } from './schemas';

// ========================================
// Mock Outreach Logs
// ========================================
export let mockOutreachLogs: OutreachLog[] = [];

// ========================================
// Mock Candidates
// ========================================
export let mockCandidates: Candidate[] = [];

// ========================================
// Mock Jobs
// ========================================
export let mockJobs: Job[] = [
  {
    id: 'j_01',
    title: 'Senior Frontend Developer (React + UX/UI)',
    client: 'Safe Software',
    clientId: 'cl_01',
    location: 'Surrey, England (Hybrid)',
    type: 'Full-time',
    salary: '£80k - £110k',
    status: 'Open',
    priority: 'High',
    postedDate: '2024-03-15',
    applicants: 2,
    requirements: ['React', 'UX/UI Design', 'TypeScript', 'Wireframing', '5+ years experience'],
  },
  {
    id: 'j_02',
    title: 'AI/ML Software Engineer (C++)',
    client: 'Creativity Software (SS8)',
    clientId: 'cl_02',
    location: 'Surrey, England (On-site)',
    type: 'Full-time',
    salary: '£90k - £130k',
    status: 'Open',
    priority: 'Medium',
    postedDate: '2024-03-10',
    applicants: 2,
    requirements: ['C++', 'Machine Learning', 'Deep Learning', 'Algorithm Optimization'],
  }
];

// ========================================
// Mock Clients
// ========================================
export let mockClients: Client[] = [
  {
    id: 'cl_01',
    companyName: 'Safe Software',
    industry: 'Enterprise Software',
    location: 'Surrey, England',
    status: 'Active',
    contactPerson: 'David Wright',
    email: 'david.wright@safesoftware.co.uk',
    openRoles: 1,
    totalPlacements: 0,
    activeSince: '2024-01-15',
    notes: 'Actively hiring frontend talent to revamp their core product UI.',
  },
  {
    id: 'cl_02',
    companyName: 'Creativity Software (SS8)',
    industry: 'Telecommunications Software',
    location: 'Surrey, England',
    status: 'Active',
    contactPerson: 'Sarah Kensington',
    email: 'sarah@creativitysoftware.co.uk',
    openRoles: 1,
    totalPlacements: 0,
    activeSince: '2024-02-01',
    notes: 'Expanding their Surrey office. Focus on high-performance C++ ML engineers.',
  },
  {
    id: 'cl_03',
    companyName: 'Electronic Arts (EA)',
    industry: 'Video Games',
    location: 'Guildford, Surrey',
    status: 'Prospect',
    contactPerson: 'James McMillan',
    email: 'jmcmillan@ea.com',
    openRoles: 0,
    totalPlacements: 0,
    activeSince: '',
    notes: 'Massive presence in Guildford. Great potential target for C++ and UI engineers.',
  },
  {
    id: 'cl_04',
    companyName: 'McLaren Applied',
    industry: 'Automotive / Tech',
    location: 'Woking, Surrey',
    status: 'Prospect',
    contactPerson: 'Chloe Davies',
    email: 'chloe.davies@mclaren.com',
    openRoles: 0,
    totalPlacements: 0,
    activeSince: '',
    notes: 'High-tech engineering firm. Always looking for embedded and ML talent.',
  },
  {
    id: 'cl_05',
    companyName: 'BAE Systems',
    industry: 'Defense & Aerospace',
    location: 'Frimley, Surrey',
    status: 'Prospect',
    contactPerson: "Liam O'Connor",
    email: 'liam.oconnor@baesystems.com',
    openRoles: 0,
    totalPlacements: 0,
    activeSince: '',
    notes: 'Huge contractor in Surrey. Needs SC-cleared developers and data scientists.',
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
