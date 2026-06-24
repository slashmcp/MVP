import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ContactRecord {
  company: string;
  phone?: string;
  email?: string;
  website?: string;
}

function normalize(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { records } = await request.json() as { records: ContactRecord[] };

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    // Fetch all existing clients
    const { data: clients, error: fetchError } = await supabase
      .from('clients')
      .select('id, company_name');

    if (fetchError) throw fetchError;

    const results = { updated: 0, created: 0, unmatched: [] as string[] };

    for (const record of records) {
      if (!record.company) continue;

      const normalizedInput = normalize(record.company);

      // Fuzzy match: strip special chars and compare lowercased
      const match = clients?.find(c => {
        const normalizedDb = normalize(c.company_name);
        return (
          normalizedDb === normalizedInput ||
          normalizedDb.includes(normalizedInput) ||
          normalizedInput.includes(normalizedDb)
        );
      });

      if (!match) {
        // Insert new client
        const newClient = {
          company_name: record.company,
          phone: record.phone && record.phone !== 'N/A' ? record.phone : null,
          email: record.email && record.email !== 'N/A' ? record.email : null,
          website_url: record.website && record.website !== 'N/A'
            ? (record.website.startsWith('http') ? record.website : `https://${record.website}`)
            : null,
          status: 'Prospect',
          notes: 'Added via contact list import.'
        };
        const { error: insertError } = await supabase
          .from('clients')
          .insert([newClient]);

        if (!insertError) {
          results.created++;
        } else {
          console.error('Failed to insert client during import:', insertError);
          results.unmatched.push(record.company);
        }
        continue;
      }

      const updates: Record<string, string> = {};
      if (record.phone && record.phone !== 'N/A') updates.phone = record.phone;
      if (record.email && record.email !== 'N/A') updates.email = record.email;
      if (record.website && record.website !== 'N/A') {
        const url = record.website.startsWith('http')
          ? record.website
          : `https://${record.website}`;
        updates.website_url = url;
      }

      if (Object.keys(updates).length === 0) continue;

      const { error: updateError } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', match.id);

      if (!updateError) results.updated++;
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error('Bulk update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
