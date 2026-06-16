import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured, getSheetData, appendSheetRow, TABS } from '@/lib/google-sheets';
import { mockJobs } from '@/lib/mock-data';

export async function GET() {
  if (isGoogleSheetsConfigured()) {
    const data = await getSheetData(TABS.jobs);
    if (data) {
      const headers = data[0];
      const rows = data.slice(1).map((row, i) => {
        const obj: Record<string, unknown> = { id: `j${i + 1}` };
        headers.forEach((h, j) => {
          obj[h.toLowerCase().replace(/\s+/g, '')] = row[j] || '';
        });
        return obj;
      });
      return NextResponse.json({ data: rows, source: 'google-sheets' });
    }
  }

  return NextResponse.json({ data: mockJobs, source: 'mock' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (isGoogleSheetsConfigured()) {
      const values = [
        body.title || '',
        body.client || '',
        body.requirements || '',
        body.location || '',
        body.salaryMin?.toString() || '',
        body.salaryMax?.toString() || '',
        body.status || 'Open',
      ];
      const success = await appendSheetRow(TABS.jobs, values);
      if (success) {
        return NextResponse.json({ success: true, source: 'google-sheets' });
      }
    }

    return NextResponse.json({
      success: true,
      source: 'mock',
      data: { id: `j${Date.now()}`, ...body, status: body.status || 'Open' },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
