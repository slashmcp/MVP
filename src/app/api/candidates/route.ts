import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured, getSheetData, appendSheetRow, TABS } from '@/lib/google-sheets';
import { getCandidates, createCandidate, updateCandidate } from '@/lib/db-client';

export async function GET() {
  try {
    // 1. Try fetching from Supabase
    const dbCands = await getCandidates();
    if (dbCands && dbCands.length > 0) {
      return NextResponse.json({ data: dbCands, source: 'supabase' });
    }

    // 2. Try Google Sheets next
    if (isGoogleSheetsConfigured()) {
      const data = await getSheetData(TABS.candidates);
      if (data) {
        const headers = data[0];
        const rows = data.slice(1).map((row, i) => {
          const obj: Record<string, any> = { id: `c${i + 1}` };
          headers.forEach((h, j) => {
            const key = h.toLowerCase().replace(/\s+/g, '');
            if (key === 'skills') {
              obj[key] = row[j]?.split(',').map((s: string) => s.trim()) || [];
            } else {
              obj[key] = row[j] || '';
            }
          });
          return obj;
        });
        return NextResponse.json({ data: rows, source: 'google-sheets' });
      }
    }
  } catch (error) {
    console.error('Error fetching candidates in API route:', error);
  }

  return NextResponse.json({ data: [], source: 'supabase' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Create in Supabase (primary database)
    const newCand = await createCandidate(body);
    if (!newCand) {
      return NextResponse.json({ error: 'Failed to write candidate to Supabase' }, { status: 500 });
    }

    // 2. Optional sync to Google Sheets
    let sheetSync = false;
    if (isGoogleSheetsConfigured()) {
      const values = [
        body.name || '',
        body.email || '',
        body.phone || '',
        body.resume || '',
        body.linkedinUrl || '',
        body.websiteUrl || '',
        Array.isArray(body.skills) ? body.skills.join(', ') : (body.skills || ''),
        body.status || 'New',
        body.notes || '',
        newCand.id,
      ];
      sheetSync = await appendSheetRow(TABS.candidates, values);
    }

    return NextResponse.json({
      success: true,
      source: sheetSync ? 'supabase+google-sheets' : 'supabase',
      data: newCand,
    });
  } catch (error) {
    console.error('Candidate POST error:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required for updating.' }, { status: 400 });
    }

    const updated = await updateCandidate(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update candidate record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Candidate PATCH error:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
