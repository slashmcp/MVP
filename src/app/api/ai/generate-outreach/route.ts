import { NextRequest, NextResponse } from 'next/server';
import { generateOutreachEmail, isOpenAIConfigured } from '@/lib/openai';

export async function POST(request: NextRequest) {
  if (!isOpenAIConfigured()) {
    return NextResponse.json({
      subject: 'Exciting Opportunity — Senior Full-Stack Engineer',
      body: 'Configure OpenAI API key in .env.local to enable AI email generation.\n\nThis is a placeholder draft.',
      source: 'mock',
    });
  }

  try {
    const body = await request.json();
    const result = await generateOutreachEmail(body);
    return NextResponse.json({ ...result, source: 'openai' });
  } catch (error) {
    console.error('Outreach generation error:', error);
    return NextResponse.json({ error: 'Failed to generate outreach' }, { status: 500 });
  }
}
