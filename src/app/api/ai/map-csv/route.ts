import { NextResponse } from 'next/server';
import { mapCsvHeaders, isOpenAIConfigured } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { headers, sampleRows } = body;

    if (!headers || !Array.isArray(headers)) {
      return NextResponse.json({ error: 'Missing or invalid headers' }, { status: 400 });
    }

    if (!isOpenAIConfigured()) {
      // Return a basic fallback mapping if OpenAI is not configured
      const fallbackMapping: Record<string, string> = {};
      headers.forEach(h => {
        const lower = h.toLowerCase();
        if (lower.includes('name')) fallbackMapping[h] = 'name';
        else if (lower.includes('mail')) fallbackMapping[h] = 'email';
        else if (lower.includes('phone') || lower.includes('tel')) fallbackMapping[h] = 'phone';
        else if (lower.includes('skill')) fallbackMapping[h] = 'skills';
        else if (lower.includes('linkedin')) fallbackMapping[h] = 'linkedinUrl';
        else if (lower.includes('status')) fallbackMapping[h] = 'status';
        else fallbackMapping[h] = 'notes';
      });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      return NextResponse.json(fallbackMapping);
    }

    const mapping = await mapCsvHeaders(headers, sampleRows || []);
    return NextResponse.json(mapping);

  } catch (error) {
    console.error('Error mapping CSV headers:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while mapping headers.' },
      { status: 500 }
    );
  }
}
