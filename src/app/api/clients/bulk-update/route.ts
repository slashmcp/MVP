import { NextRequest, NextResponse } from 'next/server';
import { createClient as createClientRecord, updateClient } from '@/lib/db-client';
import { createClient } from '@/utils/supabase/server';

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

    const supabase = await createClient();

    // Fetch all existing clients (RLS will scope to user's org)
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
        // Insert new client using createClientRecord helper
        const websiteVal = record.website && record.website !== 'N/A'
          ? (record.website.startsWith('http') ? record.website : `https://${record.website}`)
          : undefined;

        const isLinkedin = websiteVal && websiteVal.includes('linkedin.com');

        const newClientData = {
          companyName: record.company,
          email: record.email && record.email !== 'N/A' ? record.email : undefined,
          phone: record.phone && record.phone !== 'N/A' ? record.phone : undefined,
          websiteUrl: isLinkedin ? undefined : websiteVal,
          linkedinUrl: isLinkedin ? websiteVal : undefined,
          status: 'Prospect' as const,
        };
        const created = await createClientRecord(supabase, newClientData);

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
        const websiteVal = record.website.startsWith('http') ? record.website : `https://${record.website}`;
        if (websiteVal.includes('linkedin.com')) {
          updates.linkedinUrl = websiteVal;
        } else {
          updates.websiteUrl = websiteVal;
        }
      }

      if (Object.keys(updates).length === 0) continue;

      const updated = await updateClient(supabase, match.id, updates);

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
