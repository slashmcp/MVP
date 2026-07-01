import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API Key is missing.' }, { status: 500 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Initialize Anthropic
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const promptText = `You are an expert technical recruiter and data extractor. I have provided a block of unstructured text that contains a list of one or more candidates.
Your job is to extract the following information for EACH candidate found in the text and return it strictly as a JSON array of objects:
- name: The candidate's full name
- email: The candidate's email address
- phone: The candidate's phone number
- location: The candidate's current city/state or location
- role: The primary job title they are applying for or their current title
- seniority: The candidate's seniority level (e.g. Junior, Mid-Level, Senior, Director, etc.)
- company: Their current or most recent company
- linkedinUrl: The candidate's LinkedIn profile URL, if provided.
- websiteUrl: The candidate's GitHub, personal portfolio, or other website URL, if provided.
- notes: A detailed summary of their experience, key strengths, any "Source / Method" information provided, or their full profile context.
- skills: An array of strings representing their key technical skills

If you cannot find a piece of information for a candidate, return an empty string "" for that field, or an empty array [] for skills.

Return ONLY a valid JSON array (e.g., [{"name": "John", ...}]). Do not include any markdown formatting like \`\`\`json.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Using requested model ID
      max_tokens: 4000,
      temperature: 0.1,
      system: "You are a JSON extractor. Only output raw JSON, nothing else. It must be an array of objects.",
      messages: [{ 
        role: 'user', 
        content: `${promptText}\n\nCandidate Text:\n"""\n${text.substring(0, 15000)}\n"""` 
      }],
    });

    let rawJson = (message.content[0] as any).text;
    
    // Strip markdown code blocks if present
    if (rawJson.startsWith('```json')) {
      rawJson = rawJson.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (rawJson.startsWith('```')) {
      rawJson = rawJson.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    // Parse the JSON securely
    const candidates = JSON.parse(rawJson);

    if (!Array.isArray(candidates)) {
      return NextResponse.json({ error: 'Failed to extract a valid list of candidates.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: candidates });
    
  } catch (error: any) {
    console.error('Error parsing candidate text:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred while parsing the text.' }, { status: 500 });
  }
}
