import { getCandidates, deleteCandidates } from '../src/lib/db-client';

async function run() {
  const candidates = await getCandidates();
  
  const isReal = (v: any) => v && v !== 'Unknown Location' && v !== 'N/A' && v !== '—' && v !== 'Unknown';

  // The user probably meant "if they have no email and no phone, they are useless, even if they have a linkedin".
  // Because the previous AI source gave them linkedin urls but no emails/phones.
  const toDelete = candidates.filter(c => 
    !isReal(c.email) && !isReal(c.phone)
  ).map(c => c.id);

  console.log(`Found ${toDelete.length} candidates with no email and no phone.`);

  if (toDelete.length > 0) {
    const success = await deleteCandidates(toDelete);
    if (success) {
      console.log(`Successfully deleted ${toDelete.length} candidates.`);
    } else {
      console.log('Failed to delete candidates.');
    }
  } else {
    console.log('No candidates to delete.');
  }
}

run().catch(console.error);
