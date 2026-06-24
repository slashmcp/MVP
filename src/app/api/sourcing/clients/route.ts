import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Search query is required for client sourcing.' }, { status: 400 });
    }

    if (!process.env.SERPAPI_API_KEY) {
      return NextResponse.json({ error: 'MISSING_API_KEY', provider: 'serpapi' }, { status: 401 });
    }

    const searchQuery = `site:linkedin.com/company ${query}`;

    const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${process.env.SERPAPI_API_KEY}&num=10`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('SerpAPI Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch from SerpAPI' }, { status: response.status });
    }

    const data = await response.json();

    const enrichedClients = (data.organic_results || []).map((result: any, index: number) => {
      const companyName = result.title.replace(/ \| LinkedIn/g, '').trim();
      
      const snippet = result.snippet || '';
      let extractedLocation = 'Unknown Location';
      let extractedIndustry = 'Software / Technology';
      let employeeCount = '';
      
      // Extract location from snippet (e.g., "Software Development. Grimes, Iowa 809 followers.")
      const followersMatch = snippet.match(/([^.]+)\s+\d+(?:,\d+)?\s+followers/i);
      if (followersMatch && followersMatch[1]) {
        extractedLocation = followersMatch[1].trim();
      }
      
      // Extract industry from snippet (usually the first segment before the period)
      const industryMatch = snippet.match(/^([^.]+)\./);
      if (industryMatch && industryMatch[1] && industryMatch[1].length < 60) {
        extractedIndustry = industryMatch[1].trim();
      }
      
      // Extract employee count
      const empMatch = snippet.match(/(\d+(?:,\d+)?(?:-\d+(?:,\d+)?)?)\s+employees/i);
      if (empMatch) {
        employeeCount = empMatch[1] + ' employees';
      }

      // Extract company size category
      const sizeMatch = snippet.match(/Company size:\s*([^.]+)/i);
      if (sizeMatch) {
        employeeCount = sizeMatch[1].trim();
      }

      // Extract headquarters
      const hqMatch = snippet.match(/Headquarters:\s*([^.]+)/i);
      if (hqMatch) {
        extractedLocation = hqMatch[1].trim();
      }

      // Extract founded year  
      const foundedMatch = snippet.match(/Founded:\s*(\d{4})/i);
      const foundedYear = foundedMatch ? foundedMatch[1] : '';
      
      // Build a clean notes field from the real snippet data
      const notesParts = [snippet.substring(0, 150)];
      if (employeeCount) notesParts.push(`Size: ${employeeCount}`);
      if (foundedYear) notesParts.push(`Founded: ${foundedYear}`);

      return {
        id: `client_serpapi_${index}_${Date.now()}`,
        companyName: companyName,
        industry: extractedIndustry,
        location: extractedLocation,
        websiteUrl: result.link,
        status: 'Prospect',
        contactPerson: 'Requires Outreach',
        email: 'N/A',
        openRoles: 0, // Don't fake this — let the user search for real listings
        totalPlacements: 0,
        activeSince: new Date().toISOString().split('T')[0],
        notes: notesParts.join('. '),
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
