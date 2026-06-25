import { NextRequest, NextResponse } from 'next/server';
import { updateClient } from '@/lib/db-client';

export async function POST(request: NextRequest) {
  try {
    const { clientId, provider, companyName, location, email, linkedinUrl, websiteUrl } = await request.json();

    if (!clientId || !provider) {
      return NextResponse.json({ error: 'Client ID and provider are required' }, { status: 400 });
    }

    let enrichedData: Record<string, string> = {};

    let activeProvider = provider;

    if (activeProvider === 'apollo' && !process.env.APOLLO_API_KEY) {
      activeProvider = 'serp';
    }

    if (activeProvider === 'apollo') {
      const apolloKey = process.env.APOLLO_API_KEY!;

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
          const hasValidLinkedin = linkedinUrl && linkedinUrl.includes('linkedin.com');
          if (org.linkedin_url && !hasValidLinkedin) enrichedData.linkedinUrl = org.linkedin_url;
          if (org.primary_phone) enrichedData.phone = org.primary_phone;
          if (org.website_url) enrichedData.websiteUrl = org.website_url;
          if (org.industry) enrichedData.industry = org.industry;
          if (org.twitter_url) enrichedData.twitterUrl = org.twitter_url;
          if (org.facebook_url) enrichedData.facebookUrl = org.facebook_url;
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

      // Query for LinkedIn
      const queryLinkedin = `${companyName} ${location ? location : ''} linkedin`;
      const urlLinkedin = `https://serpapi.com/search.json?q=${encodeURIComponent(queryLinkedin)}&api_key=${serpKey}`;
      
      const resLinkedin = await fetch(urlLinkedin);
      if (resLinkedin.ok) {
        const data = await resLinkedin.json();
        const organicResults = data.organic_results || [];
        const linkedinResult = organicResults.find((r: any) => r.link && r.link.includes('linkedin.com/company/'));
        
        const hasValidLinkedin = linkedinUrl && linkedinUrl.includes('linkedin.com');
        if (linkedinResult && !hasValidLinkedin) {
          enrichedData.linkedinUrl = linkedinResult.link;
        }

        // Try to grab phone and website from knowledge graph or organic snippet
        const kg = data.knowledge_graph;
        const localResult = data.local_results?.[0];

        if (kg) {
           if (kg.customer_service) {
             enrichedData.phone = kg.customer_service.replace(/[^\d+\(\)\s-]/g, '').trim();
           }
           if (kg.website) {
             enrichedData.websiteUrl = kg.website;
           }
           if (kg.profiles) {
             const findProfile = (name: string) => kg.profiles.find((p: any) => p.name.toLowerCase() === name)?.link;
             const fb = findProfile('facebook');
             if (fb) enrichedData.facebookUrl = fb;
             
             const tw = findProfile('twitter') || findProfile('x');
             if (tw) enrichedData.twitterUrl = tw;
             
             const ig = findProfile('instagram');
             if (ig) enrichedData.instagramUrl = ig;
             
             const yt = findProfile('youtube');
             if (yt) enrichedData.youtubeUrl = yt;
           }
        }

        // Ratings, Reviews, and Maps
        if (kg?.rating || localResult?.rating) {
           enrichedData.googleRating = String(kg?.rating || localResult?.rating);
        }
        if (kg?.review_count || localResult?.reviews) {
           enrichedData.reviewCount = String(kg?.review_count || localResult?.reviews);
        }
        if (localResult?.links?.directions) {
           enrichedData.mapsUrl = localResult.links.directions;
        }
      } else {
        return NextResponse.json({ error: `SerpAPI returned status ${resLinkedin.status}` }, { status: 500 });
      }
    } else if (activeProvider !== 'apollo' && activeProvider !== 'serp') {
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
