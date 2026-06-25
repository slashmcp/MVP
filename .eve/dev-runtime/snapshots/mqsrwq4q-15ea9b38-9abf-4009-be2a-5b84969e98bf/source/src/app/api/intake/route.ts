import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
// @ts-ignore
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
    
    let extractedText = '';
    const fileType = file.type || file.name.split('.').pop()?.toLowerCase() || '';
    const isPdf = fileType === 'application/pdf' || fileType === 'pdf';
    const isTxt = fileType === 'text/plain' || fileType === 'txt';
    const isImage = fileType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(fileType);
    const mediaType = fileType === 'pdf' ? 'application/pdf' : fileType === 'txt' ? 'text/plain' : (fileType.includes('/') ? fileType : `image/${fileType === 'jpg' ? 'jpeg' : fileType}`);

    try {
      if (!isPdf && !isImage) {
        if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileType === 'docx') {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        } else if (isTxt) {
          extractedText = buffer.toString('utf-8');
        } else {
          return NextResponse.json({ error: `Unsupported file type: ${fileType}. Please upload PDF, DOCX, TXT, or Image.` }, { status: 400 });
        }
      }
    } catch (parseError: any) {
      console.error('Error extracting text:', parseError);
      return NextResponse.json({ error: 'Failed to extract text: ' + parseError.message }, { status: 500 });
    }

    if (!isPdf && !isImage && (!extractedText || extractedText.trim() === '')) {
      return NextResponse.json({ error: 'No text could be extracted from the document.' }, { status: 400 });
    }

    // Initialize Anthropic
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const promptText = `You are the Universal Intake AI for a Recruitment CRM.
Your job is to analyze the provided text, document, or image, and categorize it into ONE of three categories. Then, extract the relevant data and return a strict JSON object.

CATEGORIES AND SCHEMA:
1. "candidate" (If the input is a resume, CV, or LinkedIn profile of a person)
   Data Schema:
   - name: The candidate's full name
   - email: The candidate's email address
   - phone: The candidate's phone number
   - location: The candidate's current city/state or location
   - role: The primary job title they are applying for or their current title
   - company: Their current or most recent company
   - notes: A detailed summary of their experience and key strengths
   - skills: An array of strings representing their key technical skills

2. "client_list" (If the input is a list of companies, contacts, CSV data, or client leads)
   Data Schema: An array called "records" containing objects with:
   - company: Company name
   - phone: Company phone number
   - email: Company email address
   - website: Company website URL

3. "job_description" (If the input is a job posting, vacancy, or role requirements)
   Data Schema:
   - title: The job title
   - company: The hiring company
   - location: Job location
   - salary: Salary range or compensation details
   - requirements: A summary of the requirements
   - description: The full job description

OUTPUT FORMAT:
You MUST return ONLY valid JSON in this exact structure:
{
  "category": "candidate" | "client_list" | "job_description",
  "data": { ... data based on the schema above ... }
}

Do not include any markdown formatting like \`\`\`json.`;

    let userContent: any[] = [];
    
    if (isPdf || isImage) {
      userContent = [
        {
          type: isImage ? 'image' : 'document',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: buffer.toString('base64'),
          }
        },
        {
          type: 'text',
          text: promptText
        }
      ];
    } else {
      userContent = [
        {
          type: 'text',
          text: `${promptText}\n\nResume Text:\n"""\n${extractedText.substring(0, 15000)}\n"""`
        }
      ];
    }

    const message = await anthropic.messages.create({
      model: isPdf ? 'claude-haiku-4-5-20251001' : (isImage ? 'claude-3-5-sonnet-20241022' : 'claude-haiku-4-5-20251001'),
      max_tokens: 1000,
      temperature: 0.1,
      system: "You are a JSON extractor. Only output raw JSON, nothing else.",
      messages: [{ role: 'user', content: userContent }],
    });

    let rawJson = (message.content[0] as any).text;
    
    // Strip markdown code blocks if present
    if (rawJson.startsWith('```json')) {
      rawJson = rawJson.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (rawJson.startsWith('```')) {
      rawJson = rawJson.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    // Parse the JSON securely
    const candidateData = JSON.parse(rawJson);

    return NextResponse.json({ success: true, data: candidateData });
    
  } catch (error: any) {
    console.error('Error parsing resume:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred while parsing the resume.' }, { status: 500 });
  }
}
