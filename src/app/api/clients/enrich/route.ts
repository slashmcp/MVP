import { NextRequest, NextResponse } from 'next/server';
import { updateClient } from '@/lib/db-client';

export async function POST(request: NextRequest) {
  try {
    const { clientId, provider, companyName, location, email, linkedinUrl, websiteUrl } = await request.json();

    if (!clientId || !provider) {
      return NextResponse.json({ error: 'Client ID and provider are required' }, { status: 400 });
    }

    let enrichedData: Record<string, string> = {};

    if (provider === 'apollo') {
      const apolloKey = process.env.APOLLO_API_KEY;
      if (!apolloKey) {
        return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });
      }

      // Hit Apollo /v1/organizations/enrich
      const res = await fetch('https://api.apollo.io/v1/organizations/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apolloKey
        },
        body: JSON.stringify({
          domain: websiteUrl || `${companyName.replace(/\s+/g, '').toLowerCase()}.com`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const org = data.organization;
        if (org) {
          if (org.linkedin_url && !linkedinUrl) enrichedData.linkedinUrl = org.linkedin_url;
          if (org.primary_phone) enrichedData.phone = org.primary_phone;
          if (org.website_url) enrichedData.websiteUrl = org.website_url;
          if (org.industry) enrichedData.industry = org.industry;
        }
      } else {
         if (res.status === 403 || res.status === 401) {
           return NextResponse.json({ error: 'Apollo API key does not have access to the Enrichment endpoint (requires paid plan)' }, { status: 403 });
         }
         return NextResponse.json({ error: `Apollo returned status ${res.status}` }, { status: 500 });
      }
    } else if (provider === 'serp') {
      const serpKey = process.env.SERPAPI_API_KEY;
      if (!serpKey) {
        return NextResponse.json({ error: 'SerpAPI key not configured' }, { status: 500 });
      }

      // Query for LinkedIn
      const queryLinkedin = `${companyName} ${location ? location : ''} linkedin`;
      const urlLinkedin = `https://serpapi.com/search.json?q=${encodeURIComponent(queryLinkedin)}&api_key=${serpKey}`;
      
      const resLinkedin = await fetch(urlLinkedin);
      if (resLinkedin.ok) {
        const data = await resLinkedin.json();
        const organicResults = data.organic_results || [];
        const linkedinResult = organicResults.find((r: any) => r.link && r.link.includes('linkedin.com/company/'));
        
        if (linkedinResult && !linkedinUrl) {
          enrichedData.linkedinUrl = linkedinResult.link;
        }

        // Try to grab phone and website from knowledge graph or organic snippet
        if (data.knowledge_graph) {
           if (data.knowledge_graph.customer_service) {
             enrichedData.phone = data.knowledge_graph.customer_service.replace(/[^\d+\(\)\s-]/g, '').trim();
           }
           if (data.knowledge_graph.website) {
             enrichedData.websiteUrl = data.knowledge_graph.website;
           }
        }
      } else {
        return NextResponse.json({ error: `SerpAPI returned status ${resLinkedin.status}` }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    if (Object.keys(enrichedData).length > 0) {
      // Update client in DB
      const updated = await updateClient(clientId, enrichedData);
      if (!updated) {
        return NextResponse.json({ error: 'Failed to update client with enriched data' }, { status: 500 });
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
