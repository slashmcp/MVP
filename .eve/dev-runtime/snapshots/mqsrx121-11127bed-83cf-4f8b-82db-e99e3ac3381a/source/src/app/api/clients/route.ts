import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured, getSheetData, appendSheetRow, TABS } from '@/lib/google-sheets';
import { getClients, createClient, updateClient, deleteClient, deleteClients } from '@/lib/db-client';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== 'Bearer 54321') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dbClients = await getClients();
    if (dbClients && dbClients.length > 0) {
      return NextResponse.json(dbClients);
    }

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
        return NextResponse.json(rows);
      }
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Create in Supabase (primary database)
    const newClient = await createClient(body);
    if (!newClient) {
      return NextResponse.json({ error: 'Failed to write client to Supabase' }, { status: 500 });
    }

    // 2. Optional sync to Google Sheets
    if (isGoogleSheetsConfigured()) {
      const values = [
        body.companyName || '',
        body.contactPerson || '',
        body.email || '',
        body.openRoles?.toString() || '0',
        body.status || 'Active',
        body.notes || '',
      ];
      await appendSheetRow(TABS.clients, values);
    }

    return NextResponse.json({
      success: true,
      source: 'supabase',
      data: newClient,
    });
  } catch (error) {
    console.error('Error in POST /api/clients:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }
    const updated = await updateClient(id, rest);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in PATCH /api/clients:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryId = url.searchParams.get('id');

    if (queryId) {
      const ok = await deleteClient(queryId);
      return NextResponse.json({ success: ok });
    }

    const body = await request.json().catch(() => ({}));
    const { ids } = body;
    if (ids && Array.isArray(ids)) {
      const ok = await deleteClients(ids);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: 'No client IDs provided' }, { status: 400 });
  } catch (error) {
    console.error('Client DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}

