import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient, updateClient } from '@/lib/db-client';

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
      .select('id, company_name, notes');

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
        // Insert new client using createClient helper
        const newClient = {
          companyName: record.company,
          email: record.email && record.email !== 'N/A' ? record.email : undefined,
          phone: record.phone && record.phone !== 'N/A' ? record.phone : undefined,
          websiteUrl: record.website && record.website !== 'N/A'
            ? (record.website.startsWith('http') ? record.website : `https://${record.website}`)
            : undefined,
          status: 'Prospect' as const,
        };
        const created = await createClient(newClient);

        if (created) {
          results.created++;
        } else {
          results.unmatched.push(record.company);
        }
        continue;
      }

      const updates: any = {};
      if (record.email && record.email !== 'N/A') updates.email = record.email;
      if (record.phone && record.phone !== 'N/A') updates.phone = record.phone;
      if (record.website && record.website !== 'N/A') {
        updates.websiteUrl = record.website.startsWith('http') ? record.website : `https://${record.website}`;
      }

      if (Object.keys(updates).length === 0) continue;

      const updated = await updateClient(match.id, updates);

      if (updated) {
        results.updated++;
      } else {
        results.unmatched.push(record.company);
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error('Bulk update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

