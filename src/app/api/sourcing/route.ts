import { NextResponse } from 'next/server';
import { searchJuicebox } from '@/lib/juicebox';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, query, provider } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required for sourcing.' }, { status: 400 });
    }

    // Determine Sourcing Provider (Default to Juicebox if key is present or requested, fallback to Serper)
    const activeProvider = provider || (process.env.JUICEBOX_API_KEY ? 'juicebox' : 'serper');

    if (activeProvider === 'juicebox') {
      if (!process.env.JUICEBOX_API_KEY) {
        return NextResponse.json({ error: 'MISSING_API_KEY', provider: 'juicebox' }, { status: 401 });
      }

      // Sourcing with Juicebox (PeopleGPT)
      const queryText = query || 'Software Engineer';
      const juiceboxLeads = await searchJuicebox(queryText, process.env.JUICEBOX_API_KEY);

      const mappedLeads = juiceboxLeads.map((c, index) => {
        return {
          id: c.id || `juicebox_${index}_${Date.now()}`,
          name: c.name,
          email: c.email || 'No email found (Requires Outreach)',
          phone: c.phone || 'N/A',
          location: c.location || 'Unknown Location',
          linkedinUrl: c.linkedinUrl,
          githubUrl: c.githubUrl,
          stackoverflowUrl: c.stackoverflowUrl,
          scholarUrl: c.scholarUrl,
          skills: c.skills,
          seniority: c.seniority || 'Mid/Senior',
          source: c.source || 'Juicebox (PeopleGPT)',
          notes: c.notes,
          education: c.education,
          workHistory: c.workHistory,
          aiFitScore: c.rating ? c.rating * 20 : Math.floor(Math.random() * 20) + 75, // Scale rating to score (e.g. 5*20 = 100)
          status: 'New',
        };
      });

      return NextResponse.json({
        success: true,
        count: mappedLeads.length,
        leads: mappedLeads,
        provider: 'juicebox'
      });
    } else {
      // Sourcing with Serper.dev (Google Search + LinkedIn)
      if (!process.env.SERPER_API_KEY) {
        return NextResponse.json({ error: 'MISSING_API_KEY', provider: 'serper' }, { status: 401 });
      }

      const searchQuery = query ? `site:linkedin.com/in/ ${query}` : `site:linkedin.com/in/ "Software Engineer"`;

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

      const apolloKey = process.env.APOLLO_API_KEY;

      const enrichedLeadsPromises = (data.organic || []).map(async (result: any, index: number) => {
        const titleParts = result.title.split('-').map((s: string) => s.trim());
        const name = titleParts[0] || 'Unknown Name';
        const role = titleParts[1] || 'Unknown Role';
        
        let email = 'No email found (Requires Outreach)';
        let phone = 'N/A';
        let company = 'Unknown';
        let location = 'Unknown Location';

        // Attempt to enrich with Apollo.io API
        if (apolloKey && result.link && result.link.includes('linkedin.com/in/')) {
          try {
            const apolloRes = await fetch('https://api.apollo.io/api/v1/people/match', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'x-api-key': apolloKey
              },
              body: JSON.stringify({
                linkedin_url: result.link
              })
            });

            if (apolloRes.ok) {
              const apolloData = await apolloRes.json();
              if (apolloData.person) {
                if (apolloData.person.email) email = apolloData.person.email;
                if (apolloData.person.phone_numbers && apolloData.person.phone_numbers.length > 0) {
                  phone = apolloData.person.phone_numbers[0].sanitized_number || apolloData.person.phone_numbers[0].raw_number || phone;
                }
                if (apolloData.person.organization && apolloData.person.organization.name) {
                  company = apolloData.person.organization.name;
                }
                if (apolloData.person.city) {
                  location = apolloData.person.state 
                    ? `${apolloData.person.city}, ${apolloData.person.state}` 
                    : apolloData.person.city;
                }
              }
            }
          } catch (e) {
            console.error('Apollo error:', e);
          }
        }

        return {
          id: `serper_${index}_${Date.now()}`,
          name: name.replace(/ \| LinkedIn/g, ''),
          email: email,
          phone: phone,
          company: company,
          location: location,
          linkedinUrl: result.link,
          skills: [result.snippet ? result.snippet.substring(0, 50) + '...' : 'Not specified'],
          seniority: role.replace(/ \| LinkedIn/g, ''),
          source: apolloKey ? 'Google Search + Apollo Enrichment' : 'Google Search (LinkedIn)',
          notes: result.snippet,
          aiFitScore: Math.floor(Math.random() * 40) + 55,
          status: 'New',
        };
      });

      const enrichedLeads = await Promise.all(enrichedLeadsPromises);

      return NextResponse.json({
        success: true,
        count: enrichedLeads.length,
        leads: enrichedLeads,
        provider: 'serper'
      });
    }
  } catch (error) {
    console.error('Sourcing Error:', error);
    return NextResponse.json({ error: 'Failed to source candidates' }, { status: 500 });
  }
}
