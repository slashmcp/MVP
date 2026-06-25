import { NextResponse } from 'next/server';
import { getJobs, deleteJobs } from '@/lib/db-client';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const jobs = await getJobs(supabase);

    // Group by normalized title + client
    const groups: Record<string, typeof jobs> = {};
    for (const j of jobs) {
      const titleKey = j.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const clientKey = j.client.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const key = `${titleKey}_${clientKey}`;
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(j);
    }

    const toDelete: string[] = [];
    let mergedCount = 0;

    for (const [, group] of Object.entries(groups)) {
      if (group.length <= 1) continue;

      // Sort by richness: priority to jobs with longer requirements string or higher applicants
      group.sort((a, b) => {
        const reqLenA = typeof a.requirements === 'string' ? a.requirements.length : 0;
        const reqLenB = typeof b.requirements === 'string' ? b.requirements.length : 0;
        const scoreA = reqLenA + (a.applicants || 0) * 10;
        const scoreB = reqLenB + (b.applicants || 0) * 10;
        return scoreB - scoreA;
      });

      // Keep the first (richest) and mark the rest for deletion
      const losers = group.slice(1);
      for (const loser of losers) {
        toDelete.push(loser.id);
      }

      mergedCount++;
    }

    if (toDelete.length > 0) {
      await deleteJobs(supabase, toDelete);
    }

    return NextResponse.json({
      success: true,
      duplicatesRemoved: toDelete.length,
      groupsMerged: mergedCount,
      message: `Removed ${toDelete.length} duplicate job${toDelete.length !== 1 ? 's' : ''}.`,
    });
  } catch (error) {
    console.error('Dedup error:', error);
    return NextResponse.json({ error: 'Failed to deduplicate jobs' }, { status: 500 });
  }
}
