import { NextResponse } from 'next/server';
import { mockExternalLeads } from '@/lib/mock-data';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, query } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required for sourcing.' }, { status: 400 });
    }

    // Simulate network delay for sourcing (like scraping Apollo/LinkedIn)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate a semantic search or keyword match over the mock external leads
    // For MVP, we will just return a subset of the external leads based on the query or randomly.
    const lowerQuery = (query || '').toLowerCase();
    
    let sourcedLeads = mockExternalLeads;

    if (lowerQuery) {
      sourcedLeads = mockExternalLeads.filter(lead => 
        lead.skills.some(s => s.toLowerCase().includes(lowerQuery)) ||
        lead.notes.toLowerCase().includes(lowerQuery) ||
        lead.seniority.toLowerCase().includes(lowerQuery)
      );
    }

    // Assign random AI Fit Scores just to simulate the AI Ranking step that would happen 
    // simultaneously in a real pipeline.
    const enrichedLeads = sourcedLeads.map(lead => ({
      ...lead,
      aiFitScore: Math.floor(Math.random() * 40) + 55, // Score between 55 and 95
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
