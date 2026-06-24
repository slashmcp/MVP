import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured, getSheetData, appendSheetRow, TABS } from '@/lib/google-sheets';
import { getJobs, createJob, deleteJob, deleteJobs } from '@/lib/db-client';

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

    // 1. Create in Supabase (primary database)
    const newJob = await createJob(body);
    if (!newJob) {
      return NextResponse.json({ error: 'Failed to write job to Supabase' }, { status: 500 });
    }

    // 2. Optional sync to Google Sheets
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
      await appendSheetRow(TABS.jobs, values);
    }

    return NextResponse.json({
      success: true,
      source: 'supabase',
      data: newJob,
    });
  } catch (error) {
    console.error('Error in POST /api/jobs:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryId = url.searchParams.get('id');

    if (queryId) {
      const ok = await deleteJob(queryId);
      return NextResponse.json({ success: ok });
    }

    const body = await request.json().catch(() => ({}));
    const { ids } = body;
    if (ids && Array.isArray(ids)) {
      const ok = await deleteJobs(ids);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: 'No job IDs provided' }, { status: 400 });
  } catch (error) {
    console.error('Job DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}

