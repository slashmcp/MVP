import { NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/anthropic';

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

    // Strategy 1: Try SerpAPI Google Jobs engine first (best for larger companies)
    const googleJobsUrl = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(client.companyName + ' jobs')}&api_key=${process.env.SERPAPI_API_KEY}`;
    const gjRes = await fetch(googleJobsUrl);
    
    let scrapedJobs: any[] = [];
    
    if (gjRes.ok) {
      const gjData = await gjRes.json();
      const jobResults = gjData.jobs_results || [];
      
      scrapedJobs = jobResults.slice(0, 10).map((job: any, i: number) => {
        let salaryMin = 0, salaryMax = 0, salaryStr = '';
        if (job.detected_extensions?.salary) {
          salaryStr = job.detected_extensions.salary;
          const nums = salaryStr.match(/[\d,]+/g);
          if (nums && nums.length >= 2) {
            salaryMin = parseInt(nums[0].replace(/,/g, ''));
            salaryMax = parseInt(nums[1].replace(/,/g, ''));
            if (salaryMin < 1000) salaryMin *= 1000;
            if (salaryMax < 1000) salaryMax *= 1000;
          }
        }

        const description = job.description || '';
        const requirements = extractRequirements(description);

        let type = 'Full-time';
        const scheduleType = job.detected_extensions?.schedule_type;
        if (scheduleType) {
          if (scheduleType.toLowerCase().includes('contract')) type = 'Contract';
          else if (scheduleType.toLowerCase().includes('part')) type = 'Part-time';
        }

        // Detect remote/hybrid
        let location = job.location || client.location || '';
        const workFromHome = job.detected_extensions?.work_from_home;
        const titleLower = (job.title || '').toLowerCase();
        const descLower = description.toLowerCase();

        let workMode = '';
        if (workFromHome === true || /\bremote\b/i.test(location) || /\bremote\b/.test(titleLower)) {
          workMode = 'Remote';
        } else if (/\bhybrid\b/i.test(location) || /\bhybrid\b/.test(titleLower) || /\bhybrid\b/.test(descLower)) {
          workMode = 'Hybrid';
        }
        if (workMode && !location.toLowerCase().includes(workMode.toLowerCase())) {
          location = location ? `${location} (${workMode})` : workMode;
        }
        if (!location) location = 'Location not specified';

        return {
          title: job.title || 'Untitled Role',
          client: client.companyName,
          clientId: client.id,
          requirements,
          location,
          type,
          salary: salaryStr || (salaryMin && salaryMax ? `$${(salaryMin/1000).toFixed(0)}k - $${(salaryMax/1000).toFixed(0)}k` : ''),
          salaryMin,
          salaryMax,
          status: 'Sourcing',
          priority: 'Medium',
          postedDate: job.detected_extensions?.posted_at || new Date().toISOString().split('T')[0],
          applicants: 0,
          createdAt: new Date().toISOString(),
          source: 'Google Jobs',
        };
      });
    }

    // Strategy 2: If Google Jobs found nothing, try a broader web search for careers pages
    if (scrapedJobs.length === 0) {
      const webSearchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(`"${client.companyName}" careers OR hiring OR jobs`)}&api_key=${process.env.SERPAPI_API_KEY}&num=5`;
      const webRes = await fetch(webSearchUrl);
      
      if (webRes.ok) {
        const webData = await webRes.json();
        const organicResults = webData.organic_results || [];

        if (organicResults.length > 0) {
          // Use Anthropic to extract real role mentions from the search snippets
          const anthropic = getAnthropicClient();
          if (anthropic) {
            const searchContext = organicResults
              .map((r: any) => `Title: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet || ''}`)
              .join('\n\n');

            const message = await anthropic.messages.create({
              model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
              max_tokens: 2000,
              temperature: 0.1,
              system: 'You extract real job openings mentioned in search results. Return ONLY valid JSON. If no specific roles are mentioned, return {"jobs":[]}. Do NOT invent or guess roles.',
              messages: [{
                role: 'user',
                content: `Extract any REAL job openings mentioned for "${client.companyName}" in these search results. Only include roles that are explicitly named or described. Do not make up roles.\n\n${searchContext}\n\nReturn JSON: {"jobs":[{"title":"Exact Role Title","location":"Location if mentioned or Unknown","type":"Full-time or Contract or Part-time","description":"Brief context from the snippet"}]}`
              }],
            });

            const text = (message.content[0] as any).text || '';
            try {
              const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
              const parsed = JSON.parse(cleaned);
              scrapedJobs = (parsed.jobs || []).map((job: any, i: number) => ({
                title: job.title,
                client: client.companyName,
                clientId: client.id,
                requirements: job.description ? [job.description] : [],
                location: job.location || client.location || 'Unknown',
                type: job.type || 'Full-time',
                salary: '',
                salaryMin: 0,
                salaryMax: 0,
                status: 'Sourcing',
                priority: 'Medium',
                postedDate: new Date().toISOString().split('T')[0],
                applicants: 0,
                createdAt: new Date().toISOString(),
                source: 'Web Search (Careers Page)',
              }));
            } catch {
              // Anthropic didn't return valid JSON — no roles found
            }
          }
        }
      }
    }

    if (scrapedJobs.length === 0) {
      return NextResponse.json({
        success: true,
        jobs: [],
        message: `No real job listings found for "${client.companyName}". Try editing the company name or searching their careers page directly.`,
      });
    }

    return NextResponse.json({
      success: true,
      count: scrapedJobs.length,
      jobs: scrapedJobs,
    });
  } catch (error: any) {
    console.error('Job Search Error:', error);
    return NextResponse.json({ error: 'Failed to search jobs: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}

function extractRequirements(description: string): string[] {
  const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
  const requirements: string[] = [];

  for (const line of lines) {
    if (/^[\u2022\u2023\u25E6\-\*\d+\.\)]/.test(line)) {
      const cleaned = line.replace(/^[\u2022\u2023\u25E6\-\*\d+\.\)\s]+/, '').trim();
      if (cleaned.length > 10 && cleaned.length < 300) {
        requirements.push(cleaned);
      }
    }
  }

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
