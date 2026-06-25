import { NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/anthropic';
const pdfParse = require('pdf-parse');

// Mock response for when anthropic is not configured
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

    let resumeUrl = '';

    // If Vercel Blob token is configured, use it. Otherwise fallback to local.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = require('@vercel/blob');
      const safeFilename = file.name ? file.name.replace(/[^a-zA-Z0-9.-]/g, '_') : 'resume.pdf';
      const blob = await put(`resumes/${Date.now()}-${safeFilename}`, file, {
        access: 'public',
      });
      resumeUrl = blob.url;
    } else {
      // Local fallback for development if Blob isn't set up yet
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const safeFilename = file.name ? file.name.replace(/[^a-zA-Z0-9.-]/g, '_') : 'resume.pdf';
      const filename = `${Date.now()}-${safeFilename}`;
      const filePath = path.join(uploadsDir, filename);
      
      fs.writeFileSync(filePath, buffer);
      resumeUrl = `/uploads/${filename}`;
    }

    const anthropic = getAnthropicClient();
    
    // If anthropic is not configured, return mock data
    if (!anthropic) {
      console.log('anthropic not configured, returning mock parsed data.');
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({ ...MOCK_RESPONSE, resumeUrl });
    }

    // Call anthropic to extract structured data
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

    const completion = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: `RESUME TEXT:\n\n${parsedText.substring(0, 8000)}` },
      ],
      system: systemPrompt,
      temperature: 0.1,
    });

    const resultText = completion.content[0].type === 'text' ? completion.content[0].text : '{}';
    const cleanedText = resultText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const parsedData = JSON.parse(cleanedText);

    // Add the URL to the response
    parsedData.resumeUrl = resumeUrl;

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while parsing the resume.' },
      { status: 500 }
    );
  }
}
