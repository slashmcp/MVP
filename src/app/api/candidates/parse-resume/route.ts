import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API Key is missing. Please add ANTHROPIC_API_KEY to your environment variables.' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let text = '';
    const fileType = file.type || file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileType === 'application/pdf' || fileType === 'pdf') {
        const parsed = await pdfParse(buffer);
        text = parsed.text;
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileType === 'docx') {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else {
        return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF or DOCX file.' }, { status: 400 });
      }
    } catch (parseError) {
      console.error('Error extracting text:', parseError);
      return NextResponse.json({ error: 'Failed to extract text from the document.' }, { status: 500 });
    }

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'No text could be extracted from the document.' }, { status: 400 });
    }

    // Initialize Anthropic
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are an expert technical recruiter. I will provide you with the raw text of a candidate's resume.
Your job is to extract the following information and return it strictly as a JSON object:
- name: The candidate's full name
- email: The candidate's email address
- phone: The candidate's phone number
- location: The candidate's current city/state or location
- role: The primary job title they are applying for or their current title
- company: Their current or most recent company
- experience: A short summary of their experience (e.g., "5+ years in Frontend Development")
- skills: An array of strings representing their key technical skills

If you cannot find a piece of information, return an empty string "" for that field, or an empty array [] for skills.

Resume Text:
"""
${text.substring(0, 15000)}
"""

Return ONLY valid JSON. Do not include any markdown formatting like \`\`\`json.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0.1,
      system: "You are a JSON extractor. Only output raw JSON, nothing else.",
      messages: [{ role: 'user', content: prompt }],
    });

    const resultText = (message.content[0] as any).text || '{}';
    const candidateData = JSON.parse(resultText);

    return NextResponse.json({ success: true, data: candidateData });
    
  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while parsing the resume.' }, { status: 500 });
  }
}
