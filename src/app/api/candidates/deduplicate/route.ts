import { NextResponse } from 'next/server';
import { getCandidates, deleteCandidates, updateCandidate } from '@/lib/db-client';

function richness(c: any): number {
  let score = 0;
  const isReal = (v: any) => v && v !== 'Unknown Location' && v !== 'N/A' && v !== '—' && v !== 'Unknown';
  if (isReal(c.linkedinUrl)) score += 3;
  if (isReal(c.email)) score += 3;
  if (isReal(c.phone)) score += 2;
  if (isReal(c.location)) score += 2;
  if (isReal(c.company)) score += 1;
  if (isReal(c.role)) score += 1;
  if (c.skills && c.skills.length > 0) score += c.skills.length;
  if (c.notes && c.notes.length > 50) score += 1;
  if (isReal(c.resume)) score += 3;
  return score;
}

export async function POST() {
  try {
    const candidates = await getCandidates();

    // Group by normalized name
    const groups: Record<string, typeof candidates> = {};
    for (const c of candidates) {
      const key = c.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
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

      const isReal = (v: any) => v && v !== 'Unknown Location' && v !== 'N/A' && v !== '—' && v !== 'Unknown';
      const merged: any = { id: winner.id };

      for (const loser of losers) {
        if (!isReal(winner.linkedinUrl) && isReal(loser.linkedinUrl)) merged.linkedinUrl = loser.linkedinUrl;
        if (!isReal(winner.email) && isReal(loser.email)) merged.email = loser.email;
        if (!isReal(winner.phone) && isReal(loser.phone)) merged.phone = loser.phone;
        if (!isReal(winner.location) && isReal(loser.location)) merged.location = loser.location;
        if (!isReal(winner.company) && isReal(loser.company)) merged.company = loser.company;
        if (!isReal(winner.role) && isReal(loser.role)) merged.role = loser.role;
        
        // Merge skills
        if (loser.skills && loser.skills.length > 0) {
          const winnerSkills = winner.skills || [];
          const newSkills = [...new Set([...winnerSkills, ...loser.skills])];
          if (newSkills.length > winnerSkills.length) {
            merged.skills = newSkills;
          }
        }
        
        toDelete.push(loser.id);
      }

      // Update winner if we gained new fields
      if (Object.keys(merged).length > 1) {
        await updateCandidate(winner.id, merged);
      }

      mergedCount++;
    }

    if (toDelete.length > 0) {
      await deleteCandidates(toDelete);
    }

    return NextResponse.json({
      success: true,
      duplicatesRemoved: toDelete.length,
      groupsMerged: mergedCount,
      message: `Removed ${toDelete.length} duplicate candidate${toDelete.length !== 1 ? 's' : ''}. Enriched ${mergedCount} record${mergedCount !== 1 ? 's' : ''} with combined data.`,
    });
  } catch (error) {
    console.error('Dedup error:', error);
    return NextResponse.json({ error: 'Failed to deduplicate candidates' }, { status: 500 });
  }
}
