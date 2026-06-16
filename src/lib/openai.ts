import OpenAI from 'openai';

// ========================================
// OpenAI Client
// ========================================
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-your-key-here') return null;

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return !!(key && key !== 'sk-your-key-here');
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
  const client = getOpenAIClient();
  if (!client) {
    return {
      summary: 'AI summarization requires OpenAI API configuration.',
      skills: [],
      seniority: 'Unknown',
      yearsExperience: 0,
    };
  }

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a recruitment AI assistant. Analyze the following resume and return a JSON object with:
- "summary": A 2-3 sentence professional summary
- "skills": Array of technical and soft skills (max 10)
- "seniority": One of "Junior", "Mid", "Mid-Senior", "Senior", "Staff", "Principal", "Director"
- "yearsExperience": Estimated years of experience (number)`,
      },
      { role: 'user', content: resumeText },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return content ? JSON.parse(content) : { summary: '', skills: [], seniority: 'Unknown', yearsExperience: 0 };
}

export async function generateOutreachEmail(context: {
  candidateName: string;
  candidateSkills: string[];
  jobTitle: string;
  company: string;
  jobRequirements: string;
  type: 'outreach' | 'followup' | 'interview' | 'client';
}): Promise<{ subject: string; body: string }> {
  const client = getOpenAIClient();
  if (!client) {
    return {
      subject: `${context.jobTitle} Opportunity at ${context.company}`,
      body: 'AI email generation requires OpenAI API configuration.',
    };
  }

  const typePrompts = {
    outreach: 'an initial outreach email to a potential candidate',
    followup: 'a follow-up email to a candidate who hasn\'t responded',
    interview: 'an interview invitation email',
    client: 'a client update email about candidate pipeline progress',
  };

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.5,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a professional recruiter. Write ${typePrompts[context.type]}. Be concise, professional, and personalized. Return JSON with "subject" and "body" fields. Do not use markdown formatting in the body.`,
      },
      {
        role: 'user',
        content: `Candidate: ${context.candidateName}
Skills: ${context.candidateSkills.join(', ')}
Job: ${context.jobTitle} at ${context.company}
Requirements: ${context.jobRequirements}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return content ? JSON.parse(content) : { subject: '', body: '' };
}

export async function matchCandidateToJob(candidate: {
  name: string;
  skills: string[];
  seniority: string;
  notes: string;
}, job: {
  title: string;
  requirements: string;
  client: string;
}): Promise<{
  fitScore: number;
  reasoning: string;
  strengths: string[];
  gaps: string[];
}> {
  const client = getOpenAIClient();
  if (!client) {
    return {
      fitScore: 0,
      reasoning: 'AI matching requires OpenAI API configuration.',
      strengths: [],
      gaps: [],
    };
  }

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a recruitment matching AI. Compare the candidate profile to the job requirements.
Return JSON with:
- "fitScore": 0-100 integer
- "reasoning": 1-2 sentence explanation
- "strengths": Array of matching strengths (max 4)
- "gaps": Array of potential gaps (max 3)`,
      },
      {
        role: 'user',
        content: `CANDIDATE:
Name: ${candidate.name}
Skills: ${candidate.skills.join(', ')}
Seniority: ${candidate.seniority}
Notes: ${candidate.notes}

JOB:
Title: ${job.title}
Client: ${job.client}
Requirements: ${job.requirements}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return content ? JSON.parse(content) : { fitScore: 0, reasoning: '', strengths: [], gaps: [] };
}

export async function generateDailyBriefing(data: {
  candidates: Array<{ name: string; status: string; lastContactDate: string; notes: string }>;
  jobs: Array<{ title: string; client: string; status: string }>;
  clients: Array<{ companyName: string; status: string; openRoles: number }>;
}): Promise<string> {
  const client = getOpenAIClient();
  if (!client) {
    return 'AI daily briefing requires OpenAI API configuration.';
  }

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content: `You are a recruitment AI assistant generating a daily briefing for a recruiter. 
Analyze the current pipeline data and provide:
1. Top 3 priority actions for today
2. Candidates needing follow-up
3. Stale pipeline alerts (candidates stuck in same stage)
4. Suggested submissions (candidate-job matches)
5. Client relationship actions

Be concise, actionable, and specific.`,
      },
      {
        role: 'user',
        content: JSON.stringify(data),
      },
    ],
  });

  return response.choices[0]?.message?.content || 'Unable to generate briefing.';
}

export async function analyzeJob(description: string): Promise<{
  requirements: string[];
  idealProfile: string;
  sourcingKeywords: string[];
}> {
  const client = getOpenAIClient();
  if (!client) {
    return {
      requirements: [],
      idealProfile: 'AI job analysis requires OpenAI API configuration.',
      sourcingKeywords: [],
    };
  }

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Analyze this job description and return JSON with:
- "requirements": Array of key requirements
- "idealProfile": 2-3 sentence ideal candidate description
- "sourcingKeywords": Array of keywords for candidate sourcing`,
      },
      { role: 'user', content: description },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return content ? JSON.parse(content) : { requirements: [], idealProfile: '', sourcingKeywords: [] };
}

export async function mapCsvHeaders(headers: string[], sampleRows: Record<string, string>[]): Promise<Record<string, string>> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('AI mapping requires OpenAI API configuration.');
  }

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an intelligent data mapping assistant. Your job is to map an arbitrary set of CSV headers to our standardized candidate schema.
        
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
}`,
      },
      {
        role: 'user',
        content: JSON.stringify({ headers, sampleRows }),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return content ? JSON.parse(content) : {};
}
