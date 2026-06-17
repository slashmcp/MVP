import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { query, candidates } = await request.json();

    if (!query || !candidates || !Array.isArray(candidates)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const prompt = `You are an expert technical recruiter and AI matching engine.
Your task is to evaluate a list of candidates against a natural language search query and rank them by relevance.

Search Query: "${query}"

Candidates:
${JSON.stringify(candidates.map((c: any) => ({
  id: c.id,
  name: c.name,
  skills: c.skills,
  notes: c.notes,
  seniority: c.seniority
})), null, 2)}

Return a JSON array of objects. Each object must contain:
1. "candidateId": the ID of the candidate.
2. "score": a number from 0 to 100 representing how well the candidate matches the query. If a candidate completely lacks the requirements, score them low (e.g. 0-20). Only score candidates 80+ if they are a strong match.
3. "reason": A brief, 1-sentence explanation of why they received this score (e.g. "Strong match: has 6 years of React and AWS experience").

Sort the array from highest score to lowest.`;

    const schema: Schema = {
      type: Type.ARRAY,
      description: "Ranked list of candidates based on semantic match",
      items: {
        type: Type.OBJECT,
        properties: {
          candidateId: { type: Type.STRING },
          score: { type: Type.NUMBER, description: "Match score 0-100" },
          reason: { type: Type.STRING, description: "1-sentence reason for the score" }
        },
        required: ["candidateId", "score", "reason"]
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.2, // low temp for more consistent scoring
      }
    });

    const text = response.text || '';
    if (!text) {
      throw new Error('No response from AI');
    }

    const results = JSON.parse(text);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json({ error: 'Failed to perform semantic search' }, { status: 500 });
  }
}
