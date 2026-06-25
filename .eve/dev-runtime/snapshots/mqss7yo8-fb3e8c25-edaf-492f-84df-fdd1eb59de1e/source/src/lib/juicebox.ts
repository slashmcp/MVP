import type { Candidate } from './schemas';

export interface JuiceboxCandidate extends Candidate {
  education?: string;
  githubUrl?: string;
  stackoverflowUrl?: string;
  scholarUrl?: string;
  workHistory?: Array<{
    role: string;
    company: string;
    duration: string;
  }>;
}

// Highly detailed mock database of Juicebox "living profiles" that aggregate multiple sources
const JUICEBOX_MOCK_DATABASE: JuiceboxCandidate[] = [
  {
    id: 'jb_cand_001',
    name: 'Dr. Helen Vance',
    email: 'helen.vance@stanford.edu',
    phone: '+1 (415) 555-8901',
    location: 'San Francisco, CA',
    role: 'Senior Machine Learning Scientist',
    company: 'Anthropic',
    status: 'New',
    source: 'Juicebox (PeopleGPT)',
    rating: 5,
    experience: '8 years',
    seniority: 'Lead / Principal',
    skills: ['Python', 'PyTorch', 'Large Language Models', 'Transformer Architectures', 'Reinforcement Learning'],
    linkedinUrl: 'https://linkedin.com/in/helen-vance-ai',
    githubUrl: 'https://github.com/helenv-ai',
    scholarUrl: 'https://scholar.google.com/citations?user=helenvance',
    education: 'Ph.D. in Computer Science (AI/ML focus), Stanford University',
    workHistory: [
      { role: 'Senior ML Scientist', company: 'Anthropic', duration: '2023 - Present' },
      { role: 'AI Researcher', company: 'OpenAI', duration: '2021 - 2023' },
      { role: 'Graduate Research Assistant', company: 'Stanford AI Lab', duration: '2017 - 2021' }
    ],
    notes: 'Published author at NeurIPS and ICML. Expert in reinforcement learning from human feedback (RLHF). Extremely strong candidate with aggregated contributions on GitHub and Google Scholar.'
  },
  {
    id: 'jb_cand_002',
    name: 'Marcus Chen',
    email: 'marcus.chen@github.com',
    phone: '+1 (650) 555-1234',
    location: 'Seattle, WA',
    role: 'Senior React Developer / Core UX Architect',
    company: 'Vercel',
    status: 'New',
    source: 'Juicebox (PeopleGPT)',
    rating: 5,
    experience: '6 years',
    seniority: 'Senior',
    skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'WebAssembly', 'Performance Optimization'],
    linkedinUrl: 'https://linkedin.com/in/marcus-chen-dev',
    githubUrl: 'https://github.com/mchen-next',
    stackoverflowUrl: 'https://stackoverflow.com/users/998124/mchen',
    education: 'B.S. in Software Engineering, University of Washington',
    workHistory: [
      { role: 'Core UX Engineer', company: 'Vercel', duration: '2022 - Present' },
      { role: 'Frontend Engineer', company: 'Figma', duration: '2020 - 2022' },
      { role: 'Software Engineer', company: 'Microsoft', duration: '2018 - 2020' }
    ],
    notes: 'Next.js core contributor. Top 0.5% React contributor on StackOverflow. Active Open Source maintainer of various Tailwind component packages.'
  },
  {
    id: 'jb_cand_003',
    name: 'Aisha Rahman',
    email: 'aisha.rahman@protonmail.com',
    phone: '+44 7700 900502',
    location: 'London, England',
    role: 'Staff Full-Stack Engineer',
    company: 'Linear',
    status: 'New',
    source: 'Juicebox (PeopleGPT)',
    rating: 5,
    experience: '9 years',
    seniority: 'Staff',
    skills: ['Node.js', 'React', 'PostgreSQL', 'TypeScript', 'GraphQL', 'Distributed Systems'],
    linkedinUrl: 'https://linkedin.com/in/aisha-rahman-dev',
    githubUrl: 'https://github.com/aisha-r',
    education: 'M.S. in Distributed Systems, Imperial College London',
    workHistory: [
      { role: 'Staff Full-Stack Engineer', company: 'Linear', duration: '2022 - Present' },
      { role: 'Tech Lead - Core Platform', company: 'Deliveroo', duration: '2019 - 2022' },
      { role: 'Software Engineer', company: 'Skyscanner', duration: '2015 - 2019' }
    ],
    notes: 'Ex-Linear lead developer. Architected high-performance real-time sync engines. Highly proficient in PostgreSQL query optimization and distributed database systems.'
  },
  {
    id: 'jb_cand_004',
    name: 'Lucas Dupont',
    email: 'lucas.dupont@inria.fr',
    phone: '+33 6 1234 5678',
    location: 'Paris, France',
    role: 'Computer Vision & C++ Engineer',
    company: 'Inria France',
    status: 'New',
    source: 'Juicebox (PeopleGPT)',
    rating: 4,
    experience: '5 years',
    seniority: 'Senior',
    skills: ['C++', 'Python', 'OpenCV', 'CUDA', '3D Reconstruction', 'TensorRT'],
    linkedinUrl: 'https://linkedin.com/in/lucas-dupont-cv',
    githubUrl: 'https://github.com/lucas-dupont',
    scholarUrl: 'https://scholar.google.com/citations?user=lucasdupont',
    education: 'Ph.D. in Computer Vision and Robotics, Sorbonne University',
    workHistory: [
      { role: 'Research Engineer', company: 'Inria', duration: '2021 - Present' },
      { role: 'Computer Vision Architect', company: 'Dassault Systèmes', duration: '2019 - 2021' }
    ],
    notes: 'Expert in embedded computer vision and real-time 3D object rendering. Maintainer of a popular C++ wrapper for CUDA-accelerated image filters.'
  },
  {
    id: 'jb_cand_005',
    name: 'Sarah Jenkins',
    email: 'sjenkins@stripe.com',
    phone: '+1 (415) 555-7890',
    location: 'Austin, TX',
    role: 'Senior Backend / Infrastructure Engineer',
    company: 'Stripe',
    status: 'New',
    source: 'Juicebox (PeopleGPT)',
    rating: 4,
    experience: '7 years',
    seniority: 'Senior',
    skills: ['Go', 'Kubernetes', 'AWS', 'gRPC', 'Redis', 'Kafka', 'System Architecture'],
    linkedinUrl: 'https://linkedin.com/in/sarah-jenkins-cloud',
    githubUrl: 'https://github.com/sarah-j-stripe',
    stackoverflowUrl: 'https://stackoverflow.com/users/451299/sjenkins',
    education: 'B.S. in Computer Science, University of Texas at Austin',
    workHistory: [
      { role: 'Senior Systems Engineer', company: 'Stripe', duration: '2021 - Present' },
      { role: 'Infrastructure Engineer', company: 'HashiCorp', duration: '2019 - 2021' },
      { role: 'Cloud Engineer', company: 'Rackspace', duration: '2017 - 2019' }
    ],
    notes: 'Specializes in low-latency API gateways and Kubernetes orchestration. Top contributor in Go packages forums.'
  }
];

export async function searchJuicebox(query: string, apiKey?: string): Promise<JuiceboxCandidate[]> {
  // If API Key is present and is not a mock indicator, perform actual REST API request
  const hasRealKey = apiKey && apiKey !== 'your_juicebox_api_key_here' && !apiKey.startsWith('mock_');

  if (hasRealKey) {
    try {
      const response = await fetch('https://api.juicebox.ai/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          limit: 10
        })
      });

      if (!response.ok) {
        throw new Error(`Juicebox API responded with status ${response.status}`);
      }

      const data = await response.json();
      
      // Parse Juicebox profiles to our JuiceboxCandidate format
      return (data.results || []).map((lead: any, index: number) => {
        return {
          id: lead.id || `jb_${index}_${Date.now()}`,
          name: lead.name || 'Unknown Name',
          email: lead.email || 'No email found (Requires Outreach)',
          phone: lead.phone || 'N/A',
          location: lead.location || 'Unknown Location',
          role: lead.headline || lead.role || 'Software Engineer',
          company: lead.company || 'Unknown',
          status: 'New',
          source: 'Juicebox (PeopleGPT)',
          rating: lead.rating || 4,
          experience: lead.experience_years ? `${lead.experience_years} years` : 'Not specified',
          seniority: lead.seniority || 'Mid/Senior',
          skills: lead.skills || [],
          linkedinUrl: lead.linkedin_url || lead.linkedinUrl,
          githubUrl: lead.github_url || lead.githubUrl,
          stackoverflowUrl: lead.stackoverflow_url || lead.stackoverflowUrl,
          scholarUrl: lead.scholar_url || lead.scholarUrl,
          education: lead.education || '',
          workHistory: lead.work_history || [],
          notes: lead.summary || 'Enriched living profile fetched via Juicebox REST API.'
        };
      });
    } catch (e) {
      console.error('Error fetching from Juicebox API:', e);
      // Fallback to mock search in case of API failure
    }
  }

  // --- MOCK SEARCH LOGIC ---
  // Simple keyword matching to simulate semantic sourcing
  const normalizedQuery = query.toLowerCase();
  
  const matches = JUICEBOX_MOCK_DATABASE.filter(cand => {
    const nameMatch = cand.name.toLowerCase().includes(normalizedQuery);
    const roleMatch = cand.role?.toLowerCase().includes(normalizedQuery);
    const skillMatch = cand.skills?.some(s => s.toLowerCase().includes(normalizedQuery));
    const notesMatch = cand.notes?.toLowerCase().includes(normalizedQuery);
    return nameMatch || roleMatch || skillMatch || notesMatch;
  });

  // If we have specific matches, return them; otherwise, return a subset of the mock DB
  if (matches.length > 0) {
    return matches;
  }

  // Default fallback if query is very general - return first 3 candidates
  return JUICEBOX_MOCK_DATABASE.slice(0, 3);
}
