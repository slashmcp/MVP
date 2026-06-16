import { NextRequest, NextResponse } from 'next/server';
import { summarizeResume, isOpenAIConfigured } from '@/lib/openai';

export async function POST(request: NextRequest) {
  if (!isOpenAIConfigured()) {
    return NextResponse.json({
      summary: 'Configure OpenAI API key in .env.local to enable AI resume summarization.',
      skills: ['React', 'TypeScript', 'Node.js'],
      seniority: 'Senior',
      yearsExperience: 5,
      source: 'mock',
    });
  }

  try {
    const { resumeText } = await request.json();
    if (!resumeText) {
      return NextResponse.json({ error: 'resumeText is required' }, { status: 400 });
    }

    const result = await summarizeResume(resumeText);
    return NextResponse.json({ ...result, source: 'openai' });
  } catch (error) {
    console.error('Resume summarization error:', error);
    return NextResponse.json({ error: 'Failed to summarize resume' }, { status: 500 });
  }
}
