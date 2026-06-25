import { NextResponse } from 'next/server';
import { getClients, updateClient, deleteClients } from '@/lib/db-client';

/** Score a client record by how much real data it has. Higher = richer. */
function richness(c: any): number {
  let score = 0;
  const isReal = (v: any) => v && v !== 'Unknown Location' && v !== 'N/A' && v !== 'Requires Outreach' && v !== '—';
  if (isReal(c.linkedinUrl)) score += 3;
  if (isReal(c.location)) score += 2;
  if (isReal(c.email)) score += 3;
  if (isReal(c.contactPerson)) score += 2;
  if (isReal(c.industry)) score += 1;
  if (c.notes && c.notes.length > 50) score += 1;
  if (isReal(c.phone)) score += 2;
  return score;
}

export async function POST() {
  try {
    const clients = await getClients();

    // Group by normalized company name
    const groups: Record<string, typeof clients> = {};
    for (const c of clients) {
      const key = c.companyName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    }

    const toDelete: string[] = [];
    let mergedCount = 0;

    for (const [, group] of Object.entries(groups)) {
      if (group.length <= 1) continue;

      // Sort: richest record first
      group.sort((a, b) => richness(b) - richness(a));
      const winner = group[0];
      const losers = group.slice(1);

      // Merge any fields the winner is missing from all losers
      const isReal = (v: any) => v && v !== 'Unknown Location' && v !== 'N/A' && v !== 'Requires Outreach';
      const merged: any = { id: winner.id };

      for (const loser of losers) {
        if (!isReal(winner.linkedinUrl) && isReal(loser.linkedinUrl)) merged.linkedinUrl = loser.linkedinUrl;
        if (!isReal(winner.location) && isReal(loser.location)) merged.location = loser.location;
        if (!isReal(winner.email) && isReal(loser.email)) merged.email = loser.email;
        if (!isReal(winner.contactPerson) && isReal(loser.contactPerson)) merged.contactPerson = loser.contactPerson;
        if (!isReal(winner.industry) && isReal(loser.industry)) merged.industry = loser.industry;
        toDelete.push(loser.id);
      }

      // Only update if we actually gained new fields
      if (Object.keys(merged).length > 1) {
        await updateClient(winner.id, merged);
      }

      mergedCount++;
    }

    if (toDelete.length > 0) {
      await deleteClients(toDelete);
    }

    return NextResponse.json({
      success: true,
      duplicatesRemoved: toDelete.length,
      groupsMerged: mergedCount,
      message: `Removed ${toDelete.length} duplicate${toDelete.length !== 1 ? 's' : ''}. Enriched ${mergedCount} record${mergedCount !== 1 ? 's' : ''} with combined data.`,
    });
  } catch (error) {
    console.error('Dedup error:', error);
    return NextResponse.json({ error: 'Failed to deduplicate clients' }, { status: 500 });
  }
}
