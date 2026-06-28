import { NextResponse } from 'next/server';
import { createCandidate } from '@/lib/db-client';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Search query is required for candidate sourcing.' }, { status: 400 });
    }

    const serpKey = process.env.SERPAPI_API_KEY;
    if (!serpKey) {
      return NextResponse.json({ error: 'MISSING_API_KEY', provider: 'serpapi' }, { status: 401 });
    }

    const apolloKey = process.env.APOLLO_API_KEY;

    // Call SerpApi
    const searchQuery = `site:linkedin.com/in/ ${query}`;
    const serpResponse = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${serpKey}`);

    if (!serpResponse.ok) {
      const errorData = await serpResponse.json();
      console.error('SerpAPI Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch from SerpAPI' }, { status: serpResponse.status });
    }

    const data = await serpResponse.json();
    const organicResults = data.organic_results || [];

    const newCandidates = [];
    let enrichedCount = 0;
    const supabase = await createClient();

    for (const result of organicResults) {
      const link = result.link || '';
      if (!link.includes('linkedin.com/in/')) continue;

      // Title usually looks like "Name - Role - Company | LinkedIn" or similar
      const titleParts = result.title.split(/ [-|] /).map((p: string) => p.trim());
      const name = titleParts[0] || 'Unknown';
      let role = titleParts[1] || 'Candidate';
      let company = titleParts[2] && !titleParts[2].includes('LinkedIn') ? titleParts[2] : 'Unknown';

      // Fallback: try to extract from snippet
      const snippet = result.snippet || '';
      if (company === 'Unknown' && snippet.toLowerCase().includes(' at ')) {
        const afterAt = snippet.substring(snippet.toLowerCase().indexOf(' at ') + 4);
        company = afterAt.split(/[,.]/)[0].trim();
      }

      const candidateData: any = {
        name,
        role,
        company,
        linkedinUrl: link,
        source: 'AI Sourced',
        status: 'New',
        email: 'N/A',
        phone: 'N/A',
        location: 'Unknown Location',
        seniority: 'Not specified',
        skills: [],
      };

      // Enrich with Apollo if available
      if (apolloKey && name !== 'Unknown' && company !== 'Unknown') {
        const firstName = name.split(' ')[0];
        const lastName = name.split(' ').slice(1).join(' ');
        
        try {
          const apolloRes = await fetch('https://api.apollo.io/v1/people/match', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': apolloKey,
            },
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName,
              organization_name: company,
            }),
          });

          if (apolloRes.ok) {
            const apolloData = await apolloRes.json();
            const person = apolloData.person;
            if (person) {
              if (person.email) candidateData.email = person.email;
              if (person.phone_numbers && person.phone_numbers.length > 0) {
                candidateData.phone = person.phone_numbers[0].sanitized_number || 'N/A';
              }
              if (person.city) {
                candidateData.location = `${person.city}${person.state ? `, ${person.state}` : ''}`;
              }
              if (person.title) candidateData.role = person.title;
              if (person.seniority) candidateData.seniority = person.seniority;
              
              enrichedCount++;
            }
          }
        } catch (enrichError) {
          console.error('Apollo enrichment failed for', name, enrichError);
        }
      }

      // Fallback: Enrich via Edge Execution Engine Playbook (Chrome Extension Compiler)
      const edgeEngineUrl = process.env.EDGE_SCRAPER_URL || 'https://x402-edge-execution-engine.magnetarsenti.workers.dev';
      if ((candidateData.email === 'N/A' || candidateData.location === 'Unknown Location') && process.env.ENABLE_EDGE_SCRAPER === 'true') {
        try {
          const playbookResponse = await fetch(edgeEngineUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              version: '1.0',
              actions: [
                { type: 'NAVIGATE', url: link },
                { type: 'EXTRACT', selector: 'h1', dataKey: 'name' },
                { type: 'EXTRACT', selector: '.text-body-medium', dataKey: 'headline' },
                { type: 'EXTRACT', selector: '.text-body-small.inline', dataKey: 'location' }
              ]
            })
          });
          if (playbookResponse.ok) {
            const edgeData = await playbookResponse.json();
            if (edgeData.extractedData?.headline) candidateData.role = edgeData.extractedData.headline;
            if (edgeData.extractedData?.location) candidateData.location = edgeData.extractedData.location;
            enrichedCount++;
          }
        } catch (edgeErr) {
          console.warn('Edge execution engine fallback failed or timed out:', edgeErr);
        }
      }

      // Add smart location fallback from search snippet or query if still unknown
      if (candidateData.location === 'Unknown Location') {
        const fullText = `${snippet} ${result.title}`.toLowerCase();
        if (fullText.includes('edinburgh')) candidateData.location = 'Edinburgh, Scotland';
        else if (fullText.includes('glasgow')) candidateData.location = 'Glasgow, Scotland';
        else if (fullText.includes('london')) candidateData.location = 'London, England';
        else if (fullText.includes('scotland')) candidateData.location = 'Scotland, United Kingdom';
        else if (fullText.includes('iowa')) candidateData.location = 'Iowa, United States';
        else if (fullText.includes('des moines')) candidateData.location = 'Des Moines, Iowa';
      }

      const created = await createCandidate(supabase, candidateData);
      if (created) {
        newCandidates.push(created);
      }
    }

    return NextResponse.json({
      success: true,
      count: newCandidates.length,
      enrichedCount,
      candidates: newCandidates,
    });
  } catch (error) {
    console.error('Candidate Sourcing Error:', error);
    return NextResponse.json({ error: 'Failed to source candidates' }, { status: 500 });
  }
}
