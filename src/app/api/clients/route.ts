import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured, getSheetData, appendSheetRow, TABS } from '@/lib/google-sheets';
import { mockClients } from '@/lib/mock-data';

export async function GET() {
  if (isGoogleSheetsConfigured()) {
    const data = await getSheetData(TABS.clients);
    if (data) {
      const headers = data[0];
      const rows = data.slice(1).map((row, i) => {
        const obj: Record<string, unknown> = { id: `cl${i + 1}` };
        headers.forEach((h, j) => {
          obj[h.toLowerCase().replace(/\s+/g, '')] = row[j] || '';
        });
        return obj;
      });
      return NextResponse.json({ data: rows, source: 'google-sheets' });
    }
  }

  return NextResponse.json({ data: mockClients, source: 'mock' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (isGoogleSheetsConfigured()) {
      const values = [
        body.companyName || '',
        body.contactPerson || '',
        body.email || '',
        body.openRoles?.toString() || '0',
        body.status || 'Active',
        body.notes || '',
      ];
      const success = await appendSheetRow(TABS.clients, values);
      if (success) {
        return NextResponse.json({ success: true, source: 'google-sheets' });
      }
    }

    return NextResponse.json({
      success: true,
      source: 'mock',
      data: { id: `cl${Date.now()}`, ...body, status: body.status || 'Active' },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
