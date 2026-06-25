import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createCandidate, createClient as createClientRecord, createJob } from '@/lib/db-client';
import { createClient } from '@/utils/supabase/server';

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

    // Ask Anthropic to classify and parse the CSV/TXT content
    const prompt = `You are an intelligent data migration assistant for a recruitment CRM.
The user has uploaded a CSV or text file named "${filename}". 
Your job is to read the file data, determine which type of records it represents (Candidates, Clients, or Jobs), map the data to the appropriate schema below, and output a JSON response.

Here are the target schemas:

1. Candidate Schema:
- name (string, required)
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

2. Client Schema:
- companyName (string, required)
- contactPerson (string)
- email (string)
- phone (string)
- location (string)
- industry (string)
- status (string, defaults to "Prospect")
- linkedinUrl (string)
- websiteUrl (string)
- openRoles (number, defaults to 0)
- notes (string, put any extra unmapped data here)

3. Job Schema:
- title (string, required)
- client (string, required)
- requirements (string or array of strings)
- location (string)
- type (string, e.g. "Full-time", "Contract")
- salary (string)
- status (string, defaults to "Open")
- priority (string, defaults to "Medium")
- postedDate (string)
- applicants (number, defaults to 0)

CRITICAL INSTRUCTIONS:
- You must classify the input data into ONE of the three categories: 'candidates', 'clients', or 'jobs'.
- Return a JSON object with two fields:
  - "type": the classified category (either "candidates", "clients", or "jobs")
  - "data": a JSON array of records matching that schema.
- For Clients: note that the 'phone', 'linkedinUrl', and 'websiteUrl' cannot be stored in separate database columns, but you should still place them in their respective schema fields.
- Return ONLY a strict JSON object. Do not include markdown formatting or explanations.

CSV/TXT Data:
${csvText.substring(0, 50000)} // Truncated to 50k chars for safety
`;

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 4000,
      temperature: 0,
      system: "You are a strict data parsing machine. You only output valid JSON objects containing type and data fields.",
      messages: [
        {
          role: "user",
          content: prompt,
        }
      ]
    });

    const text = (message.content[0] as any).text;
    
    let responseJson: { type: string; data: any[] } = { type: '', data: [] };
    try {
      responseJson = JSON.parse(text);
    } catch (e) {
      // In case Anthropic included markdown ticks
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        responseJson = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse Anthropic JSON response');
      }
    }

    const { type, data: parsedRecords } = responseJson;

    if (!type || !Array.isArray(parsedRecords) || parsedRecords.length === 0) {
      return NextResponse.json({ error: 'No recognizable records found in the upload.' }, { status: 400 });
    }

    const supabase = await createClient();
    let count = 0;
    
    if (type === 'candidates') {
      for (const record of parsedRecords) {
        await createCandidate(supabase, record);
        count++;
      }
    } else if (type === 'clients') {
      for (const record of parsedRecords) {
        // Construct notes including phone and website
        let notes = record.notes || '';
        const notesParts = [];
        if (record.phone && record.phone !== 'N/A') notesParts.push(`Phone: ${record.phone}`);
        if (record.linkedinUrl && record.linkedinUrl !== 'N/A') notesParts.push(`LinkedIn: ${record.linkedinUrl}`);
        if (record.websiteUrl && record.websiteUrl !== 'N/A') notesParts.push(`Website: ${record.websiteUrl}`);
        if (notesParts.length > 0) {
          notes = notes ? `${notes}\n\nContact details:\n${notesParts.join('\n')}` : `Contact details:\n${notesParts.join('\n')}`;
        }
        
        await createClientRecord(supabase, {
          companyName: record.companyName,
          contactPerson: record.contactPerson,
          email: record.email,
          location: record.location,
          industry: record.industry,
          status: record.status || 'Prospect',
          notes: notes,
        });
        count++;
      }
    } else if (type === 'jobs') {
      for (const record of parsedRecords) {
        await createJob(supabase, record);
        count++;
      }
    }

    return NextResponse.json({
      success: true,
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count: count
    });
  } catch (error: any) {
    console.error('CSV Analyze API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
