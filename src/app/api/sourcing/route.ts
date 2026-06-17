import { NextResponse } from 'next/server';
import { mockExternalLeads } from '@/lib/mock-data';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, query } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required for sourcing.' }, { status: 400 });
    }

    if (!process.env.APOLLO_API_KEY) {
      return NextResponse.json({ error: 'MISSING_API_KEY', provider: 'apollo' }, { status: 401 });
    }

    // Call Apollo.io API
    const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: process.env.APOLLO_API_KEY,
        q_keywords: query || "Software Engineer",
        person_locations: ["United States"],
        per_page: 10
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Apollo API Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch from Apollo API' }, { status: response.status });
    }

    const data = await response.json();

    // Map Apollo data to our internal lead format
    const enrichedLeads = (data.people || []).map((person: any) => ({
      id: person.id,
      name: `${person.first_name} ${person.last_name}`,
      email: person.email || 'No email found',
      linkedinUrl: person.linkedin_url || '',
      skills: person.seo_description ? [person.seo_description.substring(0, 50)] : ['Not specified'],
      seniority: person.title || 'Unknown',
      source: 'Apollo.io',
      notes: `${person.title} at ${person.organization?.name || 'Unknown Company'}`,
      aiFitScore: Math.floor(Math.random() * 40) + 55, // Still simulated for MVP UI
      status: 'New',
    }));

    return NextResponse.json({
      success: true,
      count: enrichedLeads.length,
      leads: enrichedLeads,
    });
  } catch (error) {
    console.error('Sourcing Error:', error);
    return NextResponse.json({ error: 'Failed to source candidates' }, { status: 500 });
  }
}
