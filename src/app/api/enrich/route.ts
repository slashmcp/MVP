import { NextRequest, NextResponse } from 'next/server';
import { updateCandidate } from '@/lib/db-client';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { candidateId, provider, name, company, email, linkedinUrl } = await request.json();

    if (!candidateId || !provider) {
      return NextResponse.json({ error: 'Candidate ID and provider are required' }, { status: 400 });
    }

    let enrichedData: Record<string, string> = {};

    let activeProvider = provider;

    if (activeProvider === 'apollo' && !process.env.APOLLO_API_KEY) {
      activeProvider = 'serp';
    }

    if (activeProvider === 'apollo') {
      const apolloKey = process.env.APOLLO_API_KEY!;

      // Hit Apollo /v1/people/match
      const res = await fetch('https://api.apollo.io/v1/people/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apolloKey
        },
        body: JSON.stringify({
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
          if (person.email && person.email !== 'N/A') enrichedData.email = person.email;
          if (person.phone_numbers && person.phone_numbers.length > 0) {
            enrichedData.phone = person.phone_numbers[0].sanitized_number || person.phone_numbers[0].raw_number || 'N/A';
          }
          if (person.linkedin_url && !linkedinUrl) enrichedData.linkedinUrl = person.linkedin_url;
          if (person.title) enrichedData.role = person.title;
          if (person.organization?.name) enrichedData.company = person.organization.name;
          if (person.city) enrichedData.location = `${person.city}${person.state ? `, ${person.state}` : ''}`;
        }
      } else if (res.status === 401 || res.status === 403) {
        // Fallback to SerpAPI if Apollo lacks access
        activeProvider = 'serp';
      } else {
        return NextResponse.json({ error: `Apollo returned status ${res.status}` }, { status: 500 });
      }
    }
    
    if (activeProvider === 'serp') {
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
    } else if (activeProvider !== 'apollo' && activeProvider !== 'serp') {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Fallback: Use Edge Scraper Playbook to scrape contact info overlay if missing email or phone
    const targetUrl = linkedinUrl || enrichedData.linkedinUrl;
    if ((!enrichedData.email || !enrichedData.phone) && targetUrl && process.env.ENABLE_EDGE_SCRAPER === 'true') {
      const edgeEngineUrl = process.env.EDGE_SCRAPER_URL || 'https://x402-edge-execution-engine.magnetarsenti.workers.dev';
      try {
        const contactOverlayUrl = targetUrl.endsWith('/') ? `${targetUrl}overlay/contact-info/` : `${targetUrl}/overlay/contact-info/`;
        const playbookRes = await fetch(edgeEngineUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            version: '1.0',
            actions: [
              { type: 'NAVIGATE', url: contactOverlayUrl },
              { type: 'WAIT', durationMs: 2000 },
              { type: 'EXTRACT', selector: '.pv-contact-info__contact-type--email a', dataKey: 'email' },
              { type: 'EXTRACT', selector: '.pv-contact-info__contact-type--phone span', dataKey: 'phone' }
            ]
          })
        });
        if (playbookRes.ok) {
          const edgeData = await playbookRes.json();
          if (edgeData.extractedData?.email && !enrichedData.email) enrichedData.email = edgeData.extractedData.email;
          if (edgeData.extractedData?.phone && !enrichedData.phone) enrichedData.phone = edgeData.extractedData.phone;
        }
      } catch (edgeErr) {
        console.warn('Edge scraper contact info fallback failed:', edgeErr);
      }
    }

    if (Object.keys(enrichedData).length > 0) {
      // Update candidate in DB
      const supabase = await createClient();
      const updated = await updateCandidate(supabase, candidateId, enrichedData);
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
