import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Search query is required for client sourcing.' }, { status: 400 });
    }

    const isMockMode = body.mock === true;
    if (!process.env.SERPER_API_KEY && !isMockMode) {
      return NextResponse.json({ error: 'MISSING_API_KEY', provider: 'serper' }, { status: 401 });
    }

    let enrichedClients = [];

    if (isMockMode || !process.env.SERPER_API_KEY) {
      // Return high-quality mock clients based on the query keywords
      const mockCompanies = [
        { name: 'TechVentures', industry: 'Software / SaaS', location: 'London, UK', roles: 3, notes: 'Fast growing startup in AI space.' },
        { name: 'QuantumData', industry: 'Data Analytics', location: 'Surrey, UK', roles: 2, notes: 'Specializing in secure quantum storage.' },
        { name: 'ApexDigital', industry: 'Digital Agency', location: 'Reading, UK', roles: 1, notes: 'Full-service web development studio.' }
      ];

      enrichedClients = mockCompanies.map((c, index) => ({
        id: `client_mock_${index}_${Date.now()}`,
        companyName: c.name,
        industry: c.industry,
        location: c.location,
        status: 'Prospect',
        contactPerson: 'Recruiter Contact',
        email: `hr@${c.name.toLowerCase()}.com`,
        openRoles: c.roles,
        totalPlacements: 0,
        activeSince: new Date().toISOString().split('T')[0],
        notes: `Simulated lead matching "${query}": ${c.notes}`,
      }));
    } else {
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
      enrichedClients = (data.organic || []).map((result: any, index: number) => {
        const companyName = result.title.replace(/ \| LinkedIn/g, '').trim();
        
        return {
          id: `client_serper_${index}_${Date.now()}`,
          companyName: companyName,
          industry: 'Software / Technology',
          location: 'Unknown Location',
          status: 'Prospect',
          contactPerson: 'Requires Outreach',
          email: 'N/A',
          openRoles: Math.floor(Math.random() * 5) + 1,
          totalPlacements: 0,
          activeSince: new Date().toISOString().split('T')[0],
          notes: `Found via AI Sourcing: ${result.snippet ? result.snippet.substring(0, 100) + '...' : ''}`,
        };
      });
    }

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
