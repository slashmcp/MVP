import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function run() {
  const { data: candidates, error } = await supabase.from('candidates').select('*');
  if (error) { console.error(error); return; }
  if (!candidates) { console.log('No candidates found.'); return; }
  
  const isReal = (v: any) => v && v !== 'Unknown Location' && v !== 'N/A' && v !== '—' && v !== 'Unknown';

  // The user probably meant "if they have no email and no phone, they are useless, even if they have a linkedin".
  // Because the previous AI source gave them linkedin urls but no emails/phones.
  const toDelete = candidates.filter(c => 
    !isReal(c.email) && !isReal(c.phone)
  ).map((c: any) => c.id);

  console.log(`Found ${toDelete.length} candidates with no email and no phone.`);

  if (toDelete.length > 0) {
    const { error: delErr } = await supabase.from('candidates').delete().in('id', toDelete);
    if (!delErr) {
      console.log(`Successfully deleted ${toDelete.length} candidates.`);
    } else {
      console.log('Failed to delete candidates:', delErr);
    }
  } else {
    console.log('No candidates to delete.');
  }
}

run().catch(console.error);
