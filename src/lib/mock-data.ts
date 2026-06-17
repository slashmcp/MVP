import { Candidate, Job, Client, Placement, DashboardStats, DailyAction, AIInsight } from './schemas';

// ========================================
// Mock Candidates
// ========================================
export const mockCandidates: Candidate[] = [
  {
    id: 'c1',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+1 (555) 234-5678',
    linkedinUrl: 'https://linkedin.com/in/sarachen',
    websiteUrl: 'https://sarahchen.dev',
    resume: 'https://example.com/sarah-chen-resume.pdf',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
    status: 'Engaged',
    notes: 'Strong full-stack background. 6 years experience. Currently at Series B startup.',
    lastContactDate: '2026-06-14',
    seniority: 'Senior',
    createdAt: '2026-05-20',
  },
  {
    id: 'c2',
    name: 'Marcus Johnson',
    email: 'marcus.j@email.com',
    phone: '+1 (555) 345-6789',
    linkedinUrl: 'https://linkedin.com/in/marcusjohnson',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Docker'],
    status: 'Interview',
    notes: 'ML engineer with 4 years experience. PhD in Computer Science. Excellent communication.',
    lastContactDate: '2026-06-15',
    seniority: 'Mid-Senior',
    createdAt: '2026-05-18',
  },
  {
    id: 'c3',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    phone: '+1 (555) 456-7890',
    linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
    skills: ['Java', 'Spring Boot', 'Kubernetes', 'Microservices', 'Azure'],
    status: 'Submitted',
    notes: 'Backend specialist. Enterprise experience at Fortune 500. Open to relocation.',
    lastContactDate: '2026-06-13',
    seniority: 'Senior',
    createdAt: '2026-05-15',
  },
  {
    id: 'c4',
    name: 'James Park',
    email: 'james.park@email.com',
    phone: '+1 (555) 567-8901',
    linkedinUrl: 'https://linkedin.com/in/jamespark',
    skills: ['UI/UX', 'Figma', 'React', 'CSS', 'Design Systems'],
    status: 'Contacted',
    notes: 'Design engineer. Portfolio is impressive. Looking for product-focused roles.',
    lastContactDate: '2026-06-10',
    seniority: 'Mid',
    createdAt: '2026-06-01',
  },
  {
    id: 'c5',
    name: 'Aisha Patel',
    email: 'aisha.p@email.com',
    phone: '+1 (555) 678-9012',
    linkedinUrl: 'https://linkedin.com/in/aishapatel',
    skills: ['DevOps', 'Terraform', 'AWS', 'CI/CD', 'Linux'],
    status: 'New',
    notes: 'Referred by Marcus Johnson. Strong infrastructure background.',
    lastContactDate: '',
    seniority: 'Senior',
    createdAt: '2026-06-14',
  },
  {
    id: 'c6',
    name: 'David Kim',
    email: 'david.kim@email.com',
    phone: '+1 (555) 789-0123',
    linkedinUrl: 'https://linkedin.com/in/davidkim',
    skills: ['Go', 'Rust', 'Distributed Systems', 'gRPC', 'PostgreSQL'],
    status: 'Engaged',
    notes: 'Systems engineer at FAANG. Looking for startup opportunities. TC expectations $250k+.',
    lastContactDate: '2026-06-12',
    seniority: 'Staff',
    createdAt: '2026-05-28',
  },
  {
    id: 'c7',
    name: 'Lisa Wang',
    email: 'lisa.wang@email.com',
    phone: '+1 (555) 890-1234',
    linkedinUrl: 'https://linkedin.com/in/lisawang',
    skills: ['Product Management', 'Agile', 'Data Analysis', 'SQL', 'Jira'],
    status: 'Placed',
    notes: 'Placed at TechVentures as Senior PM. Start date June 1.',
    lastContactDate: '2026-06-01',
    seniority: 'Senior',
    createdAt: '2026-04-15',
  },
  {
    id: 'c8',
    name: 'Ryan O\'Brien',
    email: 'ryan.ob@email.com',
    phone: '+1 (555) 901-2345',
    linkedinUrl: 'https://linkedin.com/in/ryanobrien',
    skills: ['React Native', 'iOS', 'Swift', 'Flutter', 'Firebase'],
    status: 'Rejected',
    notes: 'Good mobile skills but salary expectations too high for current openings.',
    lastContactDate: '2026-06-08',
    seniority: 'Mid',
    createdAt: '2026-05-25',
  },
  {
    id: 'c9',
    name: 'Priya Sharma',
    email: 'priya.s@email.com',
    phone: '+1 (555) 012-3456',
    skills: ['Data Engineering', 'Spark', 'Airflow', 'BigQuery', 'Python'],
    status: 'New',
    notes: 'Strong data engineering background. Actively looking.',
    lastContactDate: '',
    seniority: 'Mid-Senior',
    createdAt: '2026-06-15',
  },
  {
    id: 'c10',
    name: 'Tom Bradley',
    email: 'tom.b@email.com',
    phone: '+1 (555) 123-4567',
    skills: ['Salesforce', 'CRM', 'Project Management', 'Agile'],
    status: 'Contacted',
    notes: 'Salesforce architect. 8 years of consulting experience.',
    lastContactDate: '2026-06-11',
    seniority: 'Senior',
    createdAt: '2026-06-03',
  },
];

// ========================================
// Mock Jobs
// ========================================
export const mockJobs: Job[] = [
  {
    id: 'j1',
    title: 'Senior Full-Stack Engineer',
    client: 'TechVentures Inc.',
    requirements: 'React, Node.js, TypeScript, PostgreSQL. 5+ years experience. Remote OK.',
    location: 'San Francisco, CA (Remote)',
    salaryMin: 160000,
    salaryMax: 200000,
    status: 'Sourcing',
    createdAt: '2026-06-01',
  },
  {
    id: 'j2',
    title: 'ML Engineer',
    client: 'DataFlow Analytics',
    requirements: 'Python, TensorFlow/PyTorch, MLOps. 3+ years. On-site preferred.',
    location: 'New York, NY',
    salaryMin: 150000,
    salaryMax: 190000,
    status: 'Interviewing',
    createdAt: '2026-05-20',
  },
  {
    id: 'j3',
    title: 'Staff Backend Engineer',
    client: 'CloudScale Solutions',
    requirements: 'Go or Rust, distributed systems, Kubernetes. 7+ years.',
    location: 'Austin, TX (Hybrid)',
    salaryMin: 200000,
    salaryMax: 260000,
    status: 'Open',
    createdAt: '2026-06-10',
  },
  {
    id: 'j4',
    title: 'DevOps Lead',
    client: 'FinanceCore',
    requirements: 'AWS, Terraform, CI/CD, team leadership. 6+ years.',
    location: 'Chicago, IL',
    salaryMin: 170000,
    salaryMax: 210000,
    status: 'Sourcing',
    createdAt: '2026-06-05',
  },
  {
    id: 'j5',
    title: 'Senior Product Designer',
    client: 'TechVentures Inc.',
    requirements: 'Figma, design systems, user research. 4+ years product design.',
    location: 'San Francisco, CA',
    salaryMin: 140000,
    salaryMax: 180000,
    status: 'Open',
    createdAt: '2026-06-12',
  },
  {
    id: 'j6',
    title: 'Data Engineer',
    client: 'DataFlow Analytics',
    requirements: 'Spark, Airflow, BigQuery, Python. 4+ years.',
    location: 'Remote',
    salaryMin: 145000,
    salaryMax: 185000,
    status: 'Open',
    createdAt: '2026-06-14',
  },
  {
    id: 'j7',
    title: 'Senior PM',
    client: 'TechVentures Inc.',
    requirements: 'B2B SaaS experience, Agile, data-driven. 5+ years.',
    location: 'San Francisco, CA',
    salaryMin: 155000,
    salaryMax: 195000,
    status: 'Filled',
    createdAt: '2026-04-20',
  },
];

// ========================================
// Mock Clients
// ========================================
export const mockClients: Client[] = [
  {
    id: 'cl1',
    companyName: 'TechVentures Inc.',
    contactPerson: 'Amanda Foster',
    email: 'amanda.foster@techventures.com',
    openRoles: 3,
    status: 'Active',
    notes: 'Series C startup. Fast hiring process. Good compensation packages.',
    createdAt: '2026-03-15',
  },
  {
    id: 'cl2',
    companyName: 'DataFlow Analytics',
    contactPerson: 'Robert Chang',
    email: 'r.chang@dataflow.io',
    openRoles: 2,
    status: 'Active',
    notes: 'Data platform company. Technical interviews are rigorous. 4-stage process.',
    createdAt: '2026-04-01',
  },
  {
    id: 'cl3',
    companyName: 'CloudScale Solutions',
    contactPerson: 'Jennifer Martinez',
    email: 'j.martinez@cloudscale.dev',
    openRoles: 1,
    status: 'Active',
    notes: 'Infrastructure company. Looking for senior talent only. Competitive offers.',
    createdAt: '2026-05-10',
  },
  {
    id: 'cl4',
    companyName: 'FinanceCore',
    contactPerson: 'Michael Thompson',
    email: 'm.thompson@financecore.com',
    openRoles: 1,
    status: 'Active',
    notes: 'Fintech startup. Strict compliance requirements. Quick decision makers.',
    createdAt: '2026-05-20',
  },
  {
    id: 'cl5',
    companyName: 'MedTech Innovations',
    contactPerson: 'Dr. Sarah Lim',
    email: 's.lim@medtechinno.com',
    openRoles: 0,
    status: 'Prospect',
    notes: 'Healthcare AI company. Potential new client. Initial call scheduled.',
    createdAt: '2026-06-10',
  },
];

// ========================================
// Mock Placements
// ========================================
export const mockPlacements: Placement[] = [
  {
    id: 'p1',
    candidateId: 'c7',
    candidateName: 'Lisa Wang',
    jobId: 'j7',
    jobTitle: 'Senior PM',
    clientId: 'cl1',
    clientName: 'TechVentures Inc.',
    date: '2026-06-01',
    revenue: 29250,
    createdAt: '2026-06-01',
  },
  {
    id: 'p2',
    candidateId: 'c11',
    candidateName: 'Alex Rivera',
    jobId: 'j8',
    jobTitle: 'Frontend Engineer',
    clientId: 'cl2',
    clientName: 'DataFlow Analytics',
    date: '2026-05-15',
    revenue: 24000,
    createdAt: '2026-05-15',
  },
  {
    id: 'p3',
    candidateId: 'c12',
    candidateName: 'Nina Petrov',
    jobId: 'j9',
    jobTitle: 'SRE',
    clientId: 'cl3',
    clientName: 'CloudScale Solutions',
    date: '2026-04-20',
    revenue: 31500,
    createdAt: '2026-04-20',
  },
];

// ========================================
// Mock Dashboard Stats
// ========================================
export const mockDashboardStats: DashboardStats = {
  activeCandidates: 8,
  activeJobs: 6,
  activeClients: 4,
  placementsThisMonth: 1,
  revenueThisMonth: 29250,
  stalledOpportunities: 2,
};

// ========================================
// Mock Daily Actions
// ========================================
export const mockDailyActions: DailyAction[] = [
  {
    id: 'da1',
    type: 'follow-up',
    title: 'Follow up with Sarah Chen',
    description: 'Engaged candidate — last contact 2 days ago. Check interview availability.',
    priority: 'high',
    dueDate: '2026-06-16',
    entityType: 'candidate',
    entityId: 'c1',
  },
  {
    id: 'da2',
    type: 'interview',
    title: 'Marcus Johnson — DataFlow interview prep',
    description: 'ML Engineer interview scheduled for tomorrow. Send prep materials.',
    priority: 'high',
    dueDate: '2026-06-16',
    entityType: 'candidate',
    entityId: 'c2',
  },
  {
    id: 'da3',
    type: 'contact',
    title: 'Reach out to Aisha Patel',
    description: 'New referral candidate. Strong DevOps profile matches FinanceCore opening.',
    priority: 'medium',
    dueDate: '2026-06-16',
    entityType: 'candidate',
    entityId: 'c5',
  },
  {
    id: 'da4',
    type: 'reminder',
    title: 'Client check-in: CloudScale Solutions',
    description: 'Weekly update on Staff Backend Engineer search. Present David Kim profile.',
    priority: 'medium',
    dueDate: '2026-06-16',
    entityType: 'client',
    entityId: 'cl3',
  },
  {
    id: 'da5',
    type: 'contact',
    title: 'Reach out to Priya Sharma',
    description: 'New candidate — Data Engineering skills match DataFlow opening.',
    priority: 'low',
    dueDate: '2026-06-17',
    entityType: 'candidate',
    entityId: 'c9',
  },
  {
    id: 'da6',
    type: 'follow-up',
    title: 'Emily Rodriguez — submission follow-up',
    description: 'Submitted to CloudScale 3 days ago. Check for client feedback.',
    priority: 'high',
    dueDate: '2026-06-16',
    entityType: 'candidate',
    entityId: 'c3',
  },
];

// ========================================
// Mock AI Insights
// ========================================
export const mockAIInsights: AIInsight[] = [
  {
    id: 'ai1',
    type: 'opportunity',
    title: 'Strong match detected',
    description: 'David Kim (Staff Systems Engineer) is a 92% match for CloudScale\'s Staff Backend Engineer role. Recommended for immediate submission.',
    actionLabel: 'View Match',
    actionUrl: '/matching',
  },
  {
    id: 'ai2',
    type: 'alert',
    title: 'Stalled pipeline',
    description: 'James Park has been in "Contacted" status for 6 days with no response. Consider a follow-up or alternative outreach channel.',
    actionLabel: 'Draft Follow-up',
    actionUrl: '/outreach',
  },
  {
    id: 'ai3',
    type: 'suggestion',
    title: 'New opening opportunity',
    description: 'MedTech Innovations (Prospect) has posted 3 engineering roles on LinkedIn. Recommend scheduling an intro call to convert to active client.',
    actionLabel: 'View Client',
    actionUrl: '/clients/cl5',
  },
  {
    id: 'ai4',
    type: 'suggestion',
    title: 'Candidate re-engagement',
    description: 'Tom Bradley (Salesforce Architect) hasn\'t been contacted in 5 days. His profile matches an upcoming FinanceCore CRM project.',
    actionLabel: 'Draft Outreach',
    actionUrl: '/outreach',
  },
];

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
