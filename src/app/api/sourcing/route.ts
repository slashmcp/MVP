import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, query } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required for sourcing.' }, { status: 400 });
    }

    if (!process.env.SERPER_API_KEY) {
      return NextResponse.json({ error: 'MISSING_API_KEY', provider: 'serper' }, { status: 401 });
    }

    const searchQuery = query ? `site:linkedin.com/in/ ${query}` : `site:linkedin.com/in/ "Software Engineer"`;

    // Call Serper.dev API
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 10
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Serper API Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch from Serper API' }, { status: response.status });
    }

    const data = await response.json();

    // Map Google organic results to our internal lead format
    const enrichedLeads = (data.organic || []).map((result: any, index: number) => {
      // Basic extraction from title: "Name - Title - Company | LinkedIn"
      const titleParts = result.title.split('-').map((s: string) => s.trim());
      const name = titleParts[0] || 'Unknown Name';
      const role = titleParts[1] || 'Unknown Role';
      
      return {
        id: `serper_${index}_${Date.now()}`,
        name: name.replace(/ \| LinkedIn/g, ''),
        email: 'No email found (Requires Outreach)',
        linkedinUrl: result.link,
        skills: [result.snippet ? result.snippet.substring(0, 50) + '...' : 'Not specified'],
        seniority: role.replace(/ \| LinkedIn/g, ''),
        source: 'Google Search (LinkedIn)',
        notes: result.snippet,
        aiFitScore: Math.floor(Math.random() * 40) + 55, // Still simulated for MVP UI
        status: 'New',
      };
    });

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
