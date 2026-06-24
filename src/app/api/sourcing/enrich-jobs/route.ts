import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { jobSchema } from '@/lib/schemas';

export const maxDuration = 60; // Allow more time for AI generation

export async function POST(req: Request) {
  try {
    const { client } = await req.json();

    if (!client || !client.companyName) {
      return NextResponse.json({ error: 'Client data is required.' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'MISSING_API_KEY', provider: 'anthropic' }, { status: 401 });
    }

    const numRoles = client.openRoles > 0 ? client.openRoles : 3;

    // Use AI to generate realistic job postings based on the client data
    const result = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      schema: z.object({
        jobs: z.array(z.object({
          title: z.string(),
          requirements: z.array(z.string()),
          type: z.enum(['Full-time', 'Contract', 'Part-time']),
          salaryMin: z.number(),
          salaryMax: z.number(),
          priority: z.enum(['High', 'Medium', 'Low']),
          location: z.string(),
        })).min(1).max(10),
      }),
      prompt: `
        You are an expert technical recruiter analyzing a client:
        Company: ${client.companyName}
        Industry: ${client.industry || 'Technology / Software'}
        Location: ${client.location || 'Remote'}
        Notes: ${client.notes || 'N/A'}

        The CRM indicates they have ${numRoles} open roles right now.
        Please generate ${numRoles} highly realistic job requisitions that this company would likely be hiring for right now.
        Make the salaries realistic for the industry and location (use USD as base if unsure, e.g. 120000).
        Make the requirements specific and highly relevant (e.g. "5+ years React", "Experience with scalable microservices in Go").
      `,
    });

    const generatedJobs = result.object.jobs.map((job, i) => ({
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
  } catch (error) {
    console.error('Job Enrichment Error:', error);
    return NextResponse.json({ error: 'Failed to enrich jobs with AI' }, { status: 500 });
  }
}
