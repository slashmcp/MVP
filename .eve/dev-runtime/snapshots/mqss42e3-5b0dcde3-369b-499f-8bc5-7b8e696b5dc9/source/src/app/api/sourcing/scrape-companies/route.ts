import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { category, location, companyName } = await request.json();

    if (!category || !location) {
      return NextResponse.json({ error: 'Category and location are required.' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API Key is missing.' }, { status: 500 });
    }

    if (!process.env.SERPAPI_API_KEY) {
      return NextResponse.json({ error: 'SERPAPI_API_KEY is missing. Please add it to your environment variables.' }, { status: 500 });
    }

    // 1. Fetch real results from Google Search (SerpApi)
    const searchQuery = `"${category}" companies in ${location} "careers" OR "hiring" OR "jobs" ${companyName || ''}`;
    
    const serpUrl = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${process.env.SERPAPI_API_KEY}&num=10`;
    
    const serpRes = await fetch(serpUrl);
    if (!serpRes.ok) throw new Error('Failed to fetch from SerpApi');
    const serpData = await serpRes.json();
    
    // 2. Feed the real organic search snippets to Anthropic to structure the data
    const organicResults = serpData.organic_results || [];
    if (organicResults.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const searchContext = organicResults.map((r: any) => `Title: ${r.title}\nLink: ${r.link}\nSnippet: ${r.snippet}`).join('\n\n');

    const prompt = `You are a data extraction assistant. I have performed a Google Search for ${category} companies hiring in ${location}.
Here are the raw search results:
${searchContext}

Extract the real companies and any open roles mentioned in the snippets.
Return ONLY a strict JSON array of objects with this exact structure:
[
  {
    "companyName": "Real Company Name",
    "websiteUrl": "https://company.com",
    "industry": "${category}",
    "location": "${location}",
    "description": "Brief description based on snippet",
    "openRoles": [
      {
        "title": "Role Title (or 'Various Roles' if unclear)",
        "salaryRange": "Unknown",
        "description": "Hiring according to search snippet."
      }
    ]
  }
]
Do not include markdown backticks.`;

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 4000,
      temperature: 0.2,
      system: "You are a strict JSON data generator.",
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const text = (message.content[0] as any).text;
    
    let parsedData = [];
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse Anthropic JSON response');
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('Scraping API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
