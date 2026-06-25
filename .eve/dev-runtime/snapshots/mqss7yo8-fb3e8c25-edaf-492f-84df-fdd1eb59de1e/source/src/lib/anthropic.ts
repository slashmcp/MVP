import Anthropic from '@anthropic-ai/sdk';

// ========================================
// Anthropic Client
// ========================================
let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  if (anthropicClient) return anthropicClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-your-key-here') return null;

  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

export function isAnthropicConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!(key && key !== 'sk-your-key-here');
}

// Helper to safely parse Claude's JSON response, stripping markdown blocks if present
function parseJsonResponse(content: string): any {
  try {
    const cleaned = content.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Anthropic JSON response:', content);
    return null;
  }
}

// ========================================
// AI Functions
// ========================================

export async function summarizeResume(resumeText: string): Promise<{
  summary: string;
  skills: string[];
  seniority: string;
  yearsExperience: number;
}> {
  const client = getAnthropicClient();
  if (!client) {
    return {
      summary: 'AI summarization requires Anthropic API configuration.',
      skills: [],
      seniority: 'Unknown',
      yearsExperience: 0,
    };
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0.3,
    system: `You are a recruitment AI assistant. Analyze the following resume and return a JSON object with:
- "summary": A 2-3 sentence professional summary
- "skills": Array of technical and soft skills (max 10)
- "seniority": One of "Junior", "Mid", "Mid-Senior", "Senior", "Staff", "Principal", "Director"
- "yearsExperience": Estimated years of experience (number)

Output ONLY valid JSON. No conversational text, no markdown formatting.`,
    messages: [
      { role: 'user', content: resumeText },
    ],
  });

  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseJsonResponse(content) || { summary: '', skills: [], seniority: 'Unknown', yearsExperience: 0 };
}

export async function generateOutreachEmail(context: {
  candidateName: string;
  candidateSkills: string[];
  jobTitle: string;
  company: string;
  jobRequirements: string;
  type: 'outreach' | 'followup' | 'interview' | 'client';
}): Promise<{ subject: string; body: string }> {
  const client = getAnthropicClient();
  if (!client) {
    return {
      subject: `${context.jobTitle} Opportunity at ${context.company}`,
      body: 'AI email generation requires Anthropic API configuration.',
    };
  }

  const typePrompts = {
    outreach: 'an initial outreach email to a potential candidate',
    followup: 'a follow-up email to a candidate who hasn\'t responded',
    interview: 'an interview invitation email',
    client: 'a client update email about candidate pipeline progress',
  };

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0.5,
    system: `You are a professional recruiter. Write ${typePrompts[context.type]}. Be concise, professional, and personalized. Return JSON with "subject" and "body" fields. Do not use markdown formatting in the body. Output ONLY valid JSON.`,
    messages: [
      {
        role: 'user',
        content: `Candidate: ${context.candidateName}\nSkills: ${context.candidateSkills.join(', ')}\nJob: ${context.jobTitle} at ${context.company}\nRequirements: ${context.jobRequirements}`,
      },
    ],
  });

  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseJsonResponse(content) || { subject: '', body: '' };
}

export async function matchCandidateToJob(candidate: {
  name: string;
  skills: string[];
  seniority: string;
  notes: string;
  location: string;
}, job: {
  title: string;
  requirements: string;
  client: string;
  location: string;
}): Promise<{
  fitScore: number;
  reasoning: string;
  strengths: string[];
  gaps: string[];
}> {
  const client = getAnthropicClient();
  if (!client) {
    return {
      fitScore: 0,
      reasoning: 'AI matching requires Anthropic API configuration.',
      strengths: [],
      gaps: [],
    };
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0.3,
    system: `You are a recruitment matching AI. Compare the candidate profile to the job requirements.
Pay STRICT attention to the following for tech roles, especially in the Surrey/London area:
1. Location & Commute: Are they close enough (e.g., Surrey local)?
2. Clearance: If the job requires "SC Cleared" or "SC Clearance", and the candidate does not have it, reduce the score significantly.
3. Tech Stack Depth: Differentiate deep expertise from surface-level keyword matching.

Return JSON with:
- "fitScore": 0-100 integer
- "reasoning": 1-2 sentence explanation
- "strengths": Array of matching strengths (max 4)
- "gaps": Array of potential gaps (max 3)

Output ONLY valid JSON. No conversational text, no markdown formatting.`,
    messages: [
      {
        role: 'user',
        content: `CANDIDATE:
Name: ${candidate.name}
Location: ${candidate.location || 'Unknown'}
Skills: ${candidate.skills.join(', ')}
Seniority: ${candidate.seniority}
Notes: ${candidate.notes || 'None'}

JOB:
Title: ${job.title}
Client: ${job.client}
Location: ${job.location || 'Unknown'}
Requirements: ${job.requirements}`,
      },
    ],
  });

  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseJsonResponse(content) || { fitScore: 0, reasoning: '', strengths: [], gaps: [] };
}

export async function generateDailyBriefing(data: {
  candidates: Array<{ name: string; status: string; lastContactDate: string; notes: string }>;
  jobs: Array<{ title: string; client: string; status: string }>;
  clients: Array<{ companyName: string; status: string; openRoles: number }>;
}): Promise<string> {
  const client = getAnthropicClient();
  if (!client) {
    return 'AI daily briefing requires Anthropic API configuration.';
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 0.4,
    system: `You are a recruitment AI assistant generating a daily briefing for a recruiter. 
Analyze the current pipeline data and provide:
1. Top 3 priority actions for today
2. Candidates needing follow-up
3. Stale pipeline alerts (candidates stuck in same stage)
4. Suggested submissions (candidate-job matches)
5. Client relationship actions

Be concise, actionable, and specific. Provide the output in clean markdown format.`,
    messages: [
      {
        role: 'user',
        content: JSON.stringify(data),
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : 'Unable to generate briefing.';
}

export async function analyzeJob(description: string): Promise<{
  requirements: string[];
  idealProfile: string;
  sourcingKeywords: string[];
}> {
  const client = getAnthropicClient();
  if (!client) {
    return {
      requirements: [],
      idealProfile: 'AI job analysis requires Anthropic API configuration.',
      sourcingKeywords: [],
    };
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0.3,
    system: `Analyze this job description and return JSON with:
- "requirements": Array of key requirements
- "idealProfile": 2-3 sentence ideal candidate description
- "sourcingKeywords": Array of keywords for candidate sourcing

Output ONLY valid JSON. No conversational text, no markdown formatting.`,
    messages: [
      { role: 'user', content: description },
    ],
  });

  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseJsonResponse(content) || { requirements: [], idealProfile: '', sourcingKeywords: [] };
}

export async function mapCsvHeaders(headers: string[], sampleRows: Record<string, string>[]): Promise<Record<string, string>> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('AI mapping requires Anthropic API configuration.');
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0.1,
    system: `You are an intelligent data mapping assistant. Your job is to map an arbitrary set of CSV headers to our standardized candidate schema.
        
Our required schema fields are:
- name (Full name of candidate)
- email (Email address)
- phone (Phone number)
- linkedinUrl (LinkedIn profile URL)
- skills (Technical or soft skills)
- notes (General notes, summary, or background)
- status (e.g. New, Screening, Interview, Offered, Rejected)

Input will be the arbitrary CSV headers and a few sample rows to give you context.
Return a JSON object where the keys are the ORIGINAL arbitrary CSV headers, and the values are our STANDARD schema fields. 
If an original header does not match any of our standard fields, map it to "notes". If multiple columns map to "notes", that is perfectly fine.

Example output:
{
  "Candidate Full Name": "name",
  "Contact No.": "phone",
  "Email Addr": "email",
  "Technologies": "skills",
  "Resume URL": "notes"
}

Output ONLY valid JSON. No conversational text, no markdown formatting.`,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({ headers, sampleRows }),
      },
    ],
  });

  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseJsonResponse(content) || {};
}
