import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createCandidate } from '@/lib/db-client'; // We'll add update functionality later if needed

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { csvText, filename } = await request.json();

    if (!csvText) {
      return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API Key is missing.' }, { status: 500 });
    }

    // Since a CSV can be large, we'll only send the first 10 rows to Anthropic to figure out the schema mapping.
    // Then we can use PapaParse locally to parse the rest, or just ask Anthropic to parse the whole thing if it's small.
    // For MVP, we will ask Anthropic to parse the whole text if it's under ~50k characters.
    
    // We will ask Anthropic to always output a JSON array of parsed objects that map to our Candidate schema.
    const prompt = `You are an intelligent data migration assistant for a recruitment CRM.
The user has uploaded a CSV file named "${filename}". 
Your job is to read the CSV data, determine if it represents Candidates, and map the columns to our Candidate schema.
If it represents Jobs or Clients, ignore it for now and return an empty array (MVP constraint).

Our Candidate schema is:
- name (string)
- email (string)
- phone (string)
- linkedinUrl (string)
- websiteUrl (string)
- role (string)
- company (string)
- skills (array of strings)
- experience (string, e.g. "5 years")
- seniority (string, e.g. "Senior")
- location (string)
- notes (string, put any extra unmapped data here)

Return ONLY a strict JSON array of objects representing the candidates. Do not include markdown formatting or explanations.

CSV Data:
${csvText.substring(0, 50000)} // Truncated to 50k chars for safety
`;

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 4000,
      temperature: 0,
      system: "You are a strict data parsing machine. You only output valid JSON arrays.",
      messages: [
        {
          role: "user",
          content: prompt,
        }
      ]
    });

    const text = (message.content[0] as any).text;
    
    let parsedData = [];
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      // In case Anthropic included markdown ticks
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse Anthropic JSON response');
      }
    }

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return NextResponse.json({ error: 'No recognizable candidates found in CSV.' }, { status: 400 });
    }

    // Insert into Supabase
    let count = 0;
    for (const cand of parsedData) {
       // Just blindly create for the MVP
       await createCandidate(cand);
       count++;
    }

    return NextResponse.json({
      success: true,
      type: 'Candidates',
      count: count
    });
  } catch (error: any) {
    console.error('CSV Analyze API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
