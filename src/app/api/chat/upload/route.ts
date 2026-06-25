import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
// @ts-ignore
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const maxDuration = 60; // Allow up to 60 seconds for Vercel

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type RecordType = 'candidates' | 'clients' | 'jobs' | 'placements' | 'unknown';

interface ParseResult {
  type: RecordType;
  count: number;
  summary: string;
  preview: any[];
}

async function extractText(file: File, buffer: Buffer): Promise<{ text: string; isImage: boolean; isPdf: boolean }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mime = file.type || '';

  const isPdf = mime === 'application/pdf' || ext === 'pdf';
  const isImage = mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
  const isDocx = mime.includes('wordprocessingml') || ext === 'docx' || ext === 'doc';
  const isCsv = mime === 'text/csv' || ext === 'csv';
  const isTxt = mime === 'text/plain' || ext === 'txt';

  if (isImage || isPdf) {
    return { text: '', isImage, isPdf };
  }

  if (isDocx) {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, isImage: false, isPdf: false };
  }

  if (isCsv || isTxt) {
    // Strip UTF-8 BOM if present
    let stripped = buffer;
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      stripped = buffer.slice(3);
    }
    // Try UTF-8, fall back to latin-1
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(stripped);
    } catch {
      text = new TextDecoder('windows-1252').decode(stripped);
    }
    // Normalise line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return { text, isImage: false, isPdf: false };
  }


  // Try as text for unknown types
  return { text: buffer.toString('utf-8'), isImage: false, isPdf: false };
}

async function classifyAndParse(file: File, buffer: Buffer, text: string, isImage: boolean, isPdf: boolean): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mime = file.type || '';

  const systemPrompt = `You are an intelligent recruitment CRM data extraction engine.
Given a file (resume, CV, business card, company profile, job description, spreadsheet, or any document), 
determine what type of recruitment data it contains and extract structured records.

Categories:
- "candidates": Resumes, CVs, LinkedIn profiles, candidate profiles, talent profiles
- "clients": Company profiles, business cards, client information, company contact sheets  
- "jobs": Job descriptions, vacancies, job postings, role descriptions
- "placements": Placement records, hire records, offer letters
- "unknown": Cannot determine

You MUST return a JSON object with this exact structure:
{
  "type": "candidates" | "clients" | "jobs" | "placements" | "unknown",
  "summary": "Brief 1-2 sentence description of what was found",
  "data": [] // array of records matching the detected type's schema
}

Candidate schema: { name, email, phone, location, role, company, skills (array), seniority, notes }
Client schema: { companyName, contactPerson, email, phone, location, industry, status, websiteUrl, notes }
Job schema: { title, client, requirements (string), location, type, salary, status, priority }
Placement schema: { candidateName, clientName, role, startDate, salary, notes }

Return ONLY valid JSON with no markdown formatting.`;

  let userContent: Anthropic.MessageParam['content'];

  if (isImage) {
    const mediaType = (mime.includes('png') ? 'image/png' :
      mime.includes('gif') ? 'image/gif' :
        mime.includes('webp') ? 'image/webp' : 'image/jpeg') as 'image/png' | 'image/gif' | 'image/webp' | 'image/jpeg';
    userContent = [
      {
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: buffer.toString('base64') }
      },
      { type: 'text', text: `File name: ${file.name}\n\nExtract all recruitment-relevant data from this image and classify it.` }
    ];
  } else if (isPdf) {
    // Try to extract text first, fall back to base64
    let pdfText = '';
    try {
      const pdfData = await pdfParse(buffer);
      pdfText = pdfData.text;
    } catch { /* ignore */ }

    if (pdfText && pdfText.trim().length > 50) {
      userContent = [{ type: 'text', text: `File: ${file.name}\n\nDocument text:\n${pdfText.substring(0, 20000)}\n\nExtract and classify this recruitment data.` }];
    } else {
      userContent = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') }
        },
        { type: 'text', text: `File: ${file.name}\n\nExtract and classify this recruitment data.` }
      ];
    }
  } else {
    userContent = [{ type: 'text', text: `File: ${file.name}\n\nDocument content:\n${text.substring(0, 20000)}\n\nExtract and classify this recruitment data.` }];
  }

  const model = isImage ? 'claude-3-5-sonnet-20241022' : 'claude-haiku-4-5-20251001';

  const message = await anthropic.messages.create({
    model,
    max_tokens: 8192,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });

  let raw = (message.content[0] as any).text;
  raw = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

  let parsed: any = { type: 'unknown', summary: 'Processed partially.', data: [] };
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn('JSON parse failed, attempting to recover partial JSON...');
    // If it's cut off, try to extract whatever complete objects we can find
    const typeMatch = raw.match(/"type"\s*:\s*"([^"]+)"/);
    if (typeMatch) parsed.type = typeMatch[1];
    
    const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]+)"/);
    if (summaryMatch) parsed.summary = summaryMatch[1];

    const dataMatch = raw.match(/"data"\s*:\s*\[([\s\S]*)/);
    if (dataMatch) {
      const dataStr = dataMatch[1];
      // Find all complete JSON objects
      const objectRegex = /\{[^{}]*\}/g;
      const objects = dataStr.match(objectRegex) || [];
      for (const objStr of objects) {
        try {
          parsed.data.push(JSON.parse(objStr));
        } catch { /* ignore broken objects */ }
      }
    }
  }

  const records: any[] = parsed.data || [];

  return {
    type: (parsed.type as RecordType) || 'unknown',
    count: records.length,
    summary: parsed.summary || 'File processed.',
    preview: records.slice(0, 3),
  };
}

async function importRecords(type: RecordType, records: any[], supabase: any): Promise<number> {
  if (type === 'unknown' || records.length === 0) return 0;

  const { createCandidate, createClient: createClientRecord, createJob } = await import('@/lib/db-client');
  let count = 0;

  if (type === 'candidates') {
    for (const r of records) {
      try { await createCandidate(supabase, r); count++; } catch { /* skip duplicates */ }
    }
  } else if (type === 'clients') {
    for (const r of records) {
      try {
        const notes = [r.notes, r.phone && `Phone: ${r.phone}`, r.websiteUrl && `Website: ${r.websiteUrl}`]
          .filter(Boolean).join('\n');
        await createClientRecord(supabase, { ...r, notes });
        count++;
      } catch { /* skip duplicates */ }
    }
  } else if (type === 'jobs') {
    for (const r of records) {
      try { await createJob(supabase, r); count++; } catch { /* skip duplicates */ }
    }
  }

  return count;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const autoImport = formData.get('autoImport') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, isImage, isPdf } = await extractText(file, buffer);
    const result = await classifyAndParse(file, buffer, text, isImage, isPdf);

    let importedCount = 0;
    if (autoImport && result.type !== 'unknown') {
      const { createClient: createSupabaseClient } = await import('@/utils/supabase/server');
      const supabase = await createSupabaseClient();
      // Re-run classification to get full data for import
      const fullResult = await classifyAndParse(file, buffer, text, isImage, isPdf);
      const fullRecords: any[] = (fullResult as any).data || result.preview;
      importedCount = await importRecords(result.type, fullRecords, supabase);
    }

    return NextResponse.json({
      success: true,
      type: result.type,
      count: result.count,
      importedCount,
      summary: result.summary,
      preview: result.preview,
      fileName: file.name,
    });
  } catch (error: any) {
    console.error('Chat upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload processing failed' }, { status: 500 });
  }
}
