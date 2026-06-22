import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, isAnthropicConfigured } from '@/lib/anthropic';

export async function POST(request: NextRequest) {
  try {
    const { query, candidates } = await request.json();

    if (!query || !candidates || !Array.isArray(candidates)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!isAnthropicConfigured()) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    const client = getAnthropicClient();
    if (!client) throw new Error('Failed to initialize Anthropic client');

    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.2,
      system: `You are an expert technical recruiter and AI matching engine.
Your task is to evaluate a list of candidates against a natural language search query and rank them by relevance.

Return a JSON array of objects. Each object must contain:
1. "candidateId": the ID of the candidate.
2. "score": a number from 0 to 100 representing how well the candidate matches the query. If a candidate completely lacks the requirements, score them low (e.g. 0-20). Only score candidates 80+ if they are a strong match.
3. "reason": A brief, 1-sentence explanation of why they received this score.

Sort the array from highest score to lowest.
Output ONLY valid JSON. No conversational text, no markdown formatting.`,
      messages: [
        {
          role: 'user',
          content: `Search Query: "${query}"

Candidates:
${JSON.stringify(candidates.map((c: any) => ({
  id: c.id,
  name: c.name,
  skills: c.skills,
  notes: c.notes,
  seniority: c.seniority
})), null, 2)}`
        }
      ]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const cleaned = content.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const results = JSON.parse(cleaned);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json({ error: 'Failed to perform semantic search' }, { status: 500 });
  }
}
