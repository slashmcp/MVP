import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured, getSheetData, appendSheetRow, TABS } from '@/lib/google-sheets';
import { mockCandidates } from '@/lib/mock-data';

export async function GET() {
  // Try Google Sheets first, fall back to mock data
  if (isGoogleSheetsConfigured()) {
    const data = await getSheetData(TABS.candidates);
    if (data) {
      const headers = data[0];
      const rows = data.slice(1).map((row, i) => {
        const obj: Record<string, unknown> = { id: `c${i + 1}` };
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

  return NextResponse.json({ data: mockCandidates, source: 'mock' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (isGoogleSheetsConfigured()) {
      const values = [
        body.name || '',
        body.email || '',
        body.phone || '',
        body.resume || '',
        body.linkedinUrl || '',
        (body.skills || []).join(', '),
        body.status || 'New',
        body.notes || '',
        '',
      ];
      const success = await appendSheetRow(TABS.candidates, values);
      if (success) {
        return NextResponse.json({ success: true, source: 'google-sheets' });
      }
    }

    // Mock response
    return NextResponse.json({
      success: true,
      source: 'mock',
      data: { id: `c${Date.now()}`, ...body, status: body.status || 'New' },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
