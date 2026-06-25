import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!process.env.SERPAPI_API_KEY) {
      return NextResponse.json({ error: 'SERPAPI_API_KEY is not configured' }, { status: 500 });
    }

    const searchUrl = new URL('https://serpapi.com/search.json');
    searchUrl.searchParams.append('engine', 'google_jobs');
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('hl', 'en');
    searchUrl.searchParams.append('api_key', process.env.SERPAPI_API_KEY);

    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({ jobs: data.jobs_results || [] });
  } catch (error) {
    console.error('Job search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search for jobs' },
      { status: 500 }
    );
  }
}
