import { NextRequest, NextResponse } from 'next/server';
import { matchCandidateToJob, isAnthropicConfigured } from '@/lib/anthropic';

export async function POST(request: NextRequest) {
  if (!isAnthropicConfigured()) {
    return NextResponse.json({
      fitScore: 85,
      reasoning: 'Configure anthropic API key for real AI matching. This is a mock score.',
      strengths: ['Relevant skills', 'Experience level match'],
      gaps: ['Mock result — enable AI for accurate analysis'],
      source: 'mock',
    });
  }

  try {
    const { candidate, job } = await request.json();
    if (!candidate || !job) {
      return NextResponse.json({ error: 'candidate and job objects are required' }, { status: 400 });
    }

    const result = await matchCandidateToJob(candidate, job);
    return NextResponse.json({ ...result, source: 'anthropic' });
  } catch (error) {
    console.error('Matching error:', error);
    return NextResponse.json({ error: 'Failed to match' }, { status: 500 });
  }
}
