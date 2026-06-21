import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured, clearSheet, appendSheetRows, TABS } from '@/lib/google-sheets';
import { Candidate } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const candidates: Candidate[] = body.candidates;

    if (!Array.isArray(candidates)) {
      return NextResponse.json({ error: 'Expected an array of candidates' }, { status: 400 });
    }

    if (!isGoogleSheetsConfigured()) {
      return NextResponse.json({
        success: true,
        source: 'mock',
        message: 'Candidates synced to sheets (mock mode — configure Google Sheets for real sync)',
        count: candidates.length,
      });
    }

    // 1. Clear the existing rows in the 'Candidates' tab (except headers)
    const cleared = await clearSheet(TABS.candidates);
    if (!cleared) {
      throw new Error('Failed to clear the sheet');
    }

    // 2. Prepare the rows
    const rows = candidates.map(c => [
      c.id || '',
      c.name || '',
      c.email || '',
      c.phone || '',
      c.location || '',
      c.role || '',
      c.company || '',
      c.seniority || '',
      (c.skills || []).join(', '),
      c.experience || '',
      c.status || '',
      c.source || '',
      c.linkedinUrl || '',
      c.githubUrl || '',
      c.websiteUrl || '',
      c.notes || '',
      c.createdAt ? new Date(c.createdAt).toISOString() : '',
    ]);

    // 3. Append all rows at once
    const appended = await appendSheetRows(TABS.candidates, rows);
    if (!appended) {
      throw new Error('Failed to append rows to the sheet');
    }

    return NextResponse.json({
      success: true,
      source: 'google-sheets',
      message: 'Candidates successfully synced to Google Sheets',
      count: candidates.length,
    });
  } catch (error) {
    console.error('Sheets sync error:', error);
    return NextResponse.json({ error: 'Failed to sync with Google Sheets' }, { status: 500 });
  }
}
