import { NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/anthropic';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { client } = await req.json();

    if (!client || !client.companyName) {
      return NextResponse.json({ error: 'Client data is required.' }, { status: 400 });
    }

    const anthropic = getAnthropicClient();
    if (!anthropic) {
      return NextResponse.json({ error: 'MISSING_API_KEY', provider: 'anthropic' }, { status: 401 });
    }

    const numRoles = Number(client.openRoles) > 0 ? Number(client.openRoles) : 3;

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 2048,
      temperature: 0.5,
      system: `You are an expert technical recruiter. Given a client company profile, generate realistic job requisitions they would likely be hiring for. Return ONLY valid JSON with a "jobs" array. Each job object should have:
- "title": Job title string
- "requirements": Array of 4-6 specific requirement strings
- "type": One of "Full-time", "Contract", "Part-time"
- "salaryMin": Number (annual USD)
- "salaryMax": Number (annual USD)
- "priority": One of "High", "Medium", "Low"
- "location": Location string

Make salaries realistic for the industry and location. Make requirements specific and highly relevant.
Output ONLY valid JSON. No markdown, no commentary.`,
      messages: [
        {
          role: 'user',
          content: `Company: ${client.companyName}
Industry: ${client.industry || 'Technology / Software'}
Location: ${client.location || 'Remote'}
Notes: ${client.notes || 'N/A'}

Generate exactly ${numRoles} job requisitions.`,
        },
      ],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Parse JSON, stripping markdown if present
    let parsed;
    try {
      const cleaned = content.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI job response:', content);
      return NextResponse.json({ error: 'AI returned invalid response' }, { status: 500 });
    }

    const generatedJobs = (parsed.jobs || []).map((job: any, i: number) => ({
      ...job,
      id: `job_ai_${Date.now()}_${i}`,
      client: client.companyName,
      clientId: client.id,
      salary: `$${(job.salaryMin / 1000).toFixed(0)}k - $${(job.salaryMax / 1000).toFixed(0)}k`,
      status: 'Sourcing',
      postedDate: new Date().toISOString().split('T')[0],
      applicants: 0,
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      jobs: generatedJobs,
    });
  } catch (error: any) {
    console.error('Job Enrichment Error:', error);
    return NextResponse.json({ error: 'Failed to enrich jobs with AI: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}
