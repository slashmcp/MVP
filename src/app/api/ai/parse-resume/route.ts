import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
const pdfParse = require('pdf-parse');

// Mock response for when OpenAI is not configured
const MOCK_RESPONSE = {
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  phone: '+1 (555) 123-4567',
  linkedinUrl: 'https://linkedin.com/in/janedoe',
  skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'GraphQL', 'TailwindCSS'],
  seniority: 'Senior',
  notes: 'Extracted via mock parser. Strong frontend engineering background with 7+ years of experience building scalable web applications. Led migration to Next.js App Router at previous company.',
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF text
    let parsedText = '';
    try {
      const pdfData = await pdfParse(buffer);
      parsedText = pdfData.text;
    } catch (e) {
      console.error('PDF parsing error:', e);
      return NextResponse.json({ error: 'Failed to read PDF file' }, { status: 400 });
    }

    if (!parsedText || parsedText.trim() === '') {
      return NextResponse.json({ error: 'No text could be extracted from the PDF' }, { status: 400 });
    }

    const openai = getOpenAIClient();
    
    // If OpenAI is not configured, return mock data
    if (!openai) {
      console.log('OpenAI not configured, returning mock parsed data.');
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json(MOCK_RESPONSE);
    }

    // Call OpenAI to extract structured data
    const systemPrompt = `You are an expert technical recruiter and resume parser.
Extract the following information from the provided raw resume text:
- name: Full name of the candidate
- email: Email address
- phone: Phone number
- linkedinUrl: LinkedIn profile URL if present, otherwise empty string
- skills: An array of up to 10 key technical or professional skills
- seniority: Determine their level (Junior, Mid, Senior, Staff, Principal, Lead, Manager, Director) based on experience.
- notes: A concise 2-3 sentence professional summary highlighting their core expertise and most notable achievements.

Return EXACTLY a JSON object matching this schema. Do not include markdown formatting or additional text.
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "linkedinUrl": "string",
  "skills": ["string"],
  "seniority": "string",
  "notes": "string"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `RESUME TEXT:\n\n${parsedText.substring(0, 8000)}` }, // Limit text to avoid token limits
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const resultText = completion.choices[0].message.content || '{}';
    const parsedData = JSON.parse(resultText);

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while parsing the resume.' },
      { status: 500 }
    );
  }
}
