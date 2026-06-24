import { NextRequest, NextResponse } from 'next/server';
import { updateCandidate } from '@/lib/db-client';

export async function POST(request: NextRequest) {
  try {
    const { candidateId, provider, name, company, email, linkedinUrl } = await request.json();

    if (!candidateId || !provider) {
      return NextResponse.json({ error: 'Candidate ID and provider are required' }, { status: 400 });
    }

    let enrichedData: Record<string, string> = {};

    if (provider === 'apollo') {
      const apolloKey = process.env.APOLLO_API_KEY;
      if (!apolloKey) {
        return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });
      }

      // Hit Apollo /v1/people/match
      const res = await fetch('https://api.apollo.io/v1/people/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          api_key: apolloKey,
          first_name: name?.split(' ')[0],
          last_name: name?.split(' ').slice(1).join(' '),
          organization_name: company,
          email: email,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const person = data.person;
        if (person) {
          if (person.linkedin_url && !linkedinUrl) enrichedData.linkedinUrl = person.linkedin_url;
          if (person.title) enrichedData.role = person.title;
          if (person.organization?.name) enrichedData.company = person.organization.name;
          if (person.city) enrichedData.location = `${person.city}${person.state ? `, ${person.state}` : ''}`;
        }
      } else {
         return NextResponse.json({ error: `Apollo returned status ${res.status}` }, { status: 500 });
      }
    } else if (provider === 'serp') {
      const serpKey = process.env.SERPAPI_API_KEY;
      if (!serpKey) {
        return NextResponse.json({ error: 'SerpAPI key not configured' }, { status: 500 });
      }

      const query = `${name} ${company ? company : ''} linkedin`;
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpKey}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const organicResults = data.organic_results || [];
        const linkedinResult = organicResults.find((r: any) => r.link && r.link.includes('linkedin.com/in/'));
        
        if (linkedinResult && !linkedinUrl) {
          enrichedData.linkedinUrl = linkedinResult.link;
        }
      } else {
        return NextResponse.json({ error: `SerpAPI returned status ${res.status}` }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    if (Object.keys(enrichedData).length > 0) {
      // Update candidate in DB
      const updated = await updateCandidate(candidateId, enrichedData);
      if (!updated) {
        return NextResponse.json({ error: 'Failed to update candidate with enriched data' }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: updated, enrichedFields: Object.keys(enrichedData) });
    } else {
      return NextResponse.json({ success: true, message: 'No new data found to enrich' });
    }

  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json({ error: 'Internal server error during enrichment' }, { status: 500 });
  }
}
