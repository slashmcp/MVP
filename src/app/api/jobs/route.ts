import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured, getSheetData, appendSheetRow, TABS } from '@/lib/google-sheets';
import { getJobs } from '@/lib/db-client';

export async function GET() {
  try {
    const dbJobs = await getJobs();
    if (dbJobs && dbJobs.length > 0) {
      return NextResponse.json({ data: dbJobs, source: 'supabase' });
    }

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
  } catch (error) {
    console.error('Error fetching jobs:', error);
  }

  return NextResponse.json({ data: [], source: 'supabase' });
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
