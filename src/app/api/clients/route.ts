import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSheetsConfigured, getSheetData, appendSheetRow, TABS } from '@/lib/google-sheets';
import { getClients, createClient as createClientRecord, updateClient, deleteClient, deleteClients } from '@/lib/db-client';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const dbClients = await getClients(supabase);
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
    const supabase = await createClient();

    // 1. Create in Supabase (primary database)
    const newClient = await createClientRecord(supabase, body);
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
    const supabase = await createClient();
    const updated = await updateClient(supabase, id, rest);
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
    const supabase = await createClient();

    if (queryId) {
      const ok = await deleteClient(supabase, queryId);
      return NextResponse.json({ success: ok });
    }

    const body = await request.json().catch(() => ({}));
    const { ids } = body;
    if (ids && Array.isArray(ids)) {
      const ok = await deleteClients(supabase, ids);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: 'No client IDs provided' }, { status: 400 });
  } catch (error) {
    console.error('Client DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
