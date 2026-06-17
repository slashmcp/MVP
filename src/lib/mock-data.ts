import { Candidate, Job, Client, Placement, DashboardStats, DailyAction, AIInsight } from './schemas';

// ========================================
// Mock Candidates
// ========================================
export let mockCandidates: Candidate[] = [
  {
    id: 'c_101',
    name: 'Emily Rostova',
    email: 'emily.rostova@gmail.com',
    phone: '+1 (415) 555-0198',
    location: 'San Francisco, CA',
    role: 'Senior React Engineer',
    company: 'Fintech Solutions Inc.',
    status: 'New',
    source: 'Apollo Scraper',
    rating: 5,
    skills: ['React', 'TypeScript', 'Next.js', 'GraphQL'],
    experience: '8 years',
    seniority: 'Senior',
    lastContact: '2024-03-20',
    notes: 'Highly experienced frontend lead. Found via Apollo.io match.',
  },
  {
    id: 'c_102',
    name: 'Marcus Thorne',
    email: 'm.thorne.dev@outlook.com',
    phone: '+1 (512) 555-0234',
    location: 'Austin, TX',
    role: 'Frontend Developer',
    company: 'HealthTech Partners',
    status: 'Contacted',
    source: 'Apollo Scraper',
    rating: 4,
    skills: ['React', 'JavaScript', 'Tailwind', 'Redux'],
    experience: '5 years',
    seniority: 'Mid-Level',
    lastContact: '2024-03-19',
  },
  {
    id: 'c_103',
    name: 'Sarah Jenkins',
    email: 'sjenkins.pm@gmail.com',
    phone: '+1 (206) 555-0811',
    location: 'Seattle, WA',
    role: 'Senior Product Manager',
    company: 'CloudScale Systems',
    status: 'New',
    source: 'Apollo Scraper',
    rating: 5,
    skills: ['Agile', 'Jira', 'Roadmapping', 'B2B SaaS'],
    experience: '9 years',
    seniority: 'Senior',
    lastContact: '2024-03-20',
    notes: 'Exceptional background in scaling B2B SaaS platforms.',
  },
  {
    id: 'c_104',
    name: 'David Kim',
    email: 'dkim.product@yahoo.com',
    phone: '+1 (650) 555-0992',
    location: 'Palo Alto, CA',
    role: 'Product Manager',
    company: 'EduTech Innovations',
    status: 'Engaged',
    source: 'Apollo Scraper',
    rating: 4,
    skills: ['Product Strategy', 'User Research', 'Data Analytics'],
    experience: '4 years',
    seniority: 'Mid-Level',
    lastContact: '2024-03-18',
  }
];

// ========================================
// Mock Jobs
// ========================================
export let mockJobs: Job[] = [
  {
    id: 'j_01',
    title: 'Senior React Engineer',
    client: 'Stripe',
    clientId: 'cl_01',
    location: 'Remote (US)',
    type: 'Full-time',
    salary: '$160k - $200k',
    status: 'Open',
    priority: 'High',
    postedDate: '2024-03-15',
    applicants: 2,
    requirements: ['React', 'TypeScript', '8+ years experience', 'System Design'],
  },
  {
    id: 'j_02',
    title: 'Senior Product Manager',
    client: 'Notion',
    clientId: 'cl_02',
    location: 'San Francisco, CA / Hybrid',
    type: 'Full-time',
    salary: '$150k - $180k',
    status: 'Open',
    priority: 'Medium',
    postedDate: '2024-03-10',
    applicants: 2,
    requirements: ['B2B SaaS', 'Agile', '5+ years PM experience', 'Data-driven'],
  }
];

// ========================================
// Mock Clients
// ========================================
export let mockClients: Client[] = [
  {
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
