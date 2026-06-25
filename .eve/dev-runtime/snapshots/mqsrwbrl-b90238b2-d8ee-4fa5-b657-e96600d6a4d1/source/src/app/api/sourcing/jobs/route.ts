import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Search query is required for job sourcing.' }, { status: 400 });
    }

    if (!process.env.SERPAPI_API_KEY) {
      return NextResponse.json({ error: 'MISSING_API_KEY', provider: 'serpapi' }, { status: 401 });
    }

    // Call SerpApi with engine=google_jobs
    const response = await fetch(`https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_API_KEY}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('SerpAPI Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch from SerpAPI' }, { status: response.status });
    }

    const data = await response.json();

    const enrichedJobs = (data.jobs_results || []).map((result: any, index: number) => {
      
      // Extract requirements from job_highlights if present
      let requirements = '';
      if (result.job_highlights && Array.isArray(result.job_highlights)) {
        const quals = result.job_highlights.find((h: any) => h.title === 'Qualifications');
        if (quals && Array.isArray(quals.items)) {
          requirements = quals.items.join(', ');
        } else {
          // fallback to first highlight
          const first = result.job_highlights[0];
          if (first && Array.isArray(first.items)) {
            requirements = first.items.join(', ');
          }
        }
      }

      // Default type based on description or title
      let type = 'Full-time';
      const desc = (result.description || '').toLowerCase();
      if (desc.includes('part-time') || desc.includes('part time')) type = 'Part-time';
      else if (desc.includes('contract')) type = 'Contract';
      else if (desc.includes('freelance')) type = 'Freelance';

      // Ensure location isn't blank
      let location = result.location || 'Unknown Location';
      if (desc.includes('remote')) location += ' (Remote)';

      return {
        id: `job_serpapi_${index}_${Date.now()}`,
        title: result.title,
        client: result.company_name || 'Unknown Company',
        location: location,
        type: type,
        requirements: requirements,
        status: 'Open',
        priority: 'Medium',
        postedDate: new Date().toISOString().split('T')[0],
        applicants: 0,
        salary: '', // Hard to parse consistently from free text without better NLP, leave blank
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedJobs.length,
      jobs: enrichedJobs,
    });
  } catch (error) {
    console.error('Job Sourcing Error:', error);
    return NextResponse.json({ error: 'Failed to source jobs' }, { status: 500 });
  }
}
