import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Clearing clients...');
    const { error: clientErr } = await supabase.from('clients').delete().neq('id', 'DO_NOT_MATCH_ANYTHING');
    if (clientErr) console.error(`Client error: ${clientErr.message}`);

    console.log('Clearing jobs...');
    const { error: jobsErr } = await supabase.from('jobs').delete().neq('id', 'DO_NOT_MATCH_ANYTHING');
    if (jobsErr) console.error(`Job error: ${jobsErr.message}`);

    console.log('Clearing candidates...');
    const { error: candErr } = await supabase.from('candidates').delete().neq('id', 'DO_NOT_MATCH_ANYTHING');
    if (candErr) console.error(`Candidate error: ${candErr.message}`);

    console.log('Done clearing tables!');
  } catch (error) {
    console.error('Clearing failed:', error);
  }
}

run();
