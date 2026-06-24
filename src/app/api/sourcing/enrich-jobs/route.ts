import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { client } = await req.json();

    if (!client || !client.companyName) {
      return NextResponse.json({ error: 'Client data is required.' }, { status: 400 });
    }

    if (!process.env.SERPAPI_API_KEY) {
      return NextResponse.json({ error: 'MISSING_API_KEY', provider: 'serpapi' }, { status: 401 });
    }

    // Use SerpAPI Google Jobs engine to find REAL job listings
    const searchQuery = `${client.companyName} jobs`;
    const serpUrl = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(searchQuery)}&api_key=${process.env.SERPAPI_API_KEY}`;

    const response = await fetch(serpUrl);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('SerpAPI Jobs Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch jobs from SerpAPI' }, { status: response.status });
    }

    const data = await response.json();
    const jobResults = data.jobs_results || [];

    if (jobResults.length === 0) {
      return NextResponse.json({
        success: true,
        jobs: [],
        message: `No real job listings found for "${client.companyName}". Try editing the company name for better results.`,
      });
    }

    // Map real Google Jobs data to our internal Job format
    const scrapedJobs = jobResults.slice(0, 10).map((job: any, i: number) => {
      // Parse salary if available
      let salaryMin = 0;
      let salaryMax = 0;
      let salaryStr = '';

      if (job.detected_extensions?.salary) {
        salaryStr = job.detected_extensions.salary;
        // Try to extract numbers from salary string like "$80K–$120K" or "$80,000–$120,000"
        const nums = salaryStr.match(/[\d,]+/g);
        if (nums && nums.length >= 2) {
          salaryMin = parseInt(nums[0].replace(/,/g, ''));
          salaryMax = parseInt(nums[1].replace(/,/g, ''));
          // If they look like "80" and "120", multiply by 1000
          if (salaryMin < 1000) salaryMin *= 1000;
          if (salaryMax < 1000) salaryMax *= 1000;
        }
      }

      // Extract requirements from description highlights or full description
      const description = job.description || '';
      const requirements = extractRequirements(description);

      // Determine job type
      let type = 'Full-time';
      const scheduleType = job.detected_extensions?.schedule_type;
      if (scheduleType) {
        if (scheduleType.toLowerCase().includes('contract')) type = 'Contract';
        else if (scheduleType.toLowerCase().includes('part')) type = 'Part-time';
      }

      return {
        title: job.title || 'Untitled Role',
        client: client.companyName,
        clientId: client.id,
        requirements: requirements,
        location: job.location || client.location || 'Remote',
        type: type,
        salary: salaryStr || (salaryMin && salaryMax ? `$${(salaryMin/1000).toFixed(0)}k - $${(salaryMax/1000).toFixed(0)}k` : ''),
        salaryMin: salaryMin,
        salaryMax: salaryMax,
        status: 'Sourcing',
        priority: 'Medium',
        postedDate: job.detected_extensions?.posted_at || new Date().toISOString().split('T')[0],
        applicants: 0,
        createdAt: new Date().toISOString(),
        source: 'Google Jobs (SerpAPI)',
      };
    });

    return NextResponse.json({
      success: true,
      count: scrapedJobs.length,
      jobs: scrapedJobs,
    });
  } catch (error: any) {
    console.error('Job Enrichment Error:', error);
    return NextResponse.json({ error: 'Failed to scrape jobs: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}

// Extract bullet-point requirements from a job description
function extractRequirements(description: string): string[] {
  const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
  const requirements: string[] = [];

  for (const line of lines) {
    // Look for bullet points, numbered items, or lines starting with "•", "-", "*"
    if (/^[\u2022\u2023\u25E6\-\*\d+\.\)]/.test(line)) {
      const cleaned = line.replace(/^[\u2022\u2023\u25E6\-\*\d+\.\)\s]+/, '').trim();
      if (cleaned.length > 10 && cleaned.length < 300) {
        requirements.push(cleaned);
      }
    }
  }

  // If no bullets found, try to extract key requirement sentences
  if (requirements.length === 0) {
    const sentences = description.split(/[.!]\s+/);
    for (const s of sentences) {
      const trimmed = s.trim();
      if (
        trimmed.length > 20 && trimmed.length < 200 &&
        /(?:experience|proficiency|knowledge|degree|years|required|must|ability|skills)/i.test(trimmed)
      ) {
        requirements.push(trimmed);
        if (requirements.length >= 6) break;
      }
    }
  }

  return requirements.slice(0, 8);
}
