import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured, getSheetData, appendSheetRow, TABS } from '@/lib/google-sheets';
import { mockPlacements } from '@/lib/mock-data';

export async function GET() {
  if (isGoogleSheetsConfigured()) {
    const data = await getSheetData(TABS.placements);
    if (data) {
      const headers = data[0];
      const rows = data.slice(1).map((row, i) => {
        const obj: Record<string, unknown> = { id: `p${i + 1}` };
        headers.forEach((h, j) => {
          obj[h.toLowerCase().replace(/\s+/g, '')] = row[j] || '';
        });
        return obj;
      });
      return NextResponse.json({ data: rows, source: 'google-sheets' });
    }
  }

  return NextResponse.json({ data: mockPlacements, source: 'mock' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (isGoogleSheetsConfigured()) {
      const values = [
        body.candidateId || '',
        body.candidateName || '',
        body.jobId || '',
        body.jobTitle || '',
        body.clientId || '',
        body.clientName || '',
        body.date || new Date().toISOString().split('T')[0],
        body.revenue?.toString() || '0',
      ];
      const success = await appendSheetRow(TABS.placements, values);
      if (success) {
        return NextResponse.json({ success: true, source: 'google-sheets' });
      }
    }

    return NextResponse.json({
      success: true,
      source: 'mock',
      data: { id: `p${Date.now()}`, ...body },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
