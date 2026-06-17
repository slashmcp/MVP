import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Search query is required for client sourcing.' }, { status: 400 });
    }

    if (!process.env.SERPER_API_KEY) {
      return NextResponse.json({ error: 'MISSING_API_KEY', provider: 'serper' }, { status: 401 });
    }

    const searchQuery = `site:linkedin.com/company ${query}`;

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

    // Map Google organic results to our internal Client format
    const enrichedClients = (data.organic || []).map((result: any, index: number) => {
      // Result title is usually "Company Name | LinkedIn"
      const companyName = result.title.replace(/ \| LinkedIn/g, '').trim();
      
      return {
        id: `client_serper_${index}_${Date.now()}`,
        companyName: companyName,
        industry: 'Software / Technology', // Default generic
        location: 'Unknown Location', // Difficult to extract reliably from a snippet
        status: 'Prospect',
        contactPerson: 'Requires Outreach',
        email: 'N/A',
        openRoles: Math.floor(Math.random() * 5) + 1, // Simulated active roles for demo
        totalPlacements: 0,
        activeSince: new Date().toISOString().split('T')[0],
        notes: `Found via AI Sourcing: ${result.snippet ? result.snippet.substring(0, 100) + '...' : ''}`,
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedClients.length,
      clients: enrichedClients,
    });
  } catch (error) {
    console.error('Client Sourcing Error:', error);
    return NextResponse.json({ error: 'Failed to source clients' }, { status: 500 });
  }
}
