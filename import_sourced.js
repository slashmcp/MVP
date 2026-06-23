const fs = require('fs');

async function importCsvToSupabase() {
  const env = fs.readFileSync('.env.local', 'utf8').split('\n');
  const getEnv = (key) => env.find(l => l.startsWith(key))?.split('=')[1]?.trim();
  const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const SUPABASE_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const Papa = require('./node_modules/papaparse');
  const file = fs.readFileSync('sourced_candidates.csv', 'utf8');
  
  const parsed = Papa.parse(file, { header: true, skipEmptyLines: true });
  const data = parsed.data;

  console.log(`Found ${data.length} candidates in CSV.`);

  const candidates = data.map(c => ({
    name: c['name'] || 'Unknown',
    email: 'N/A', // Real emails aren't generally scraped
    phone: 'N/A',
    location: c['location'] || 'Glasgow',
    role: c['title'] || 'Candidate',
    company: c['company'] || 'Unknown',
    status: 'New',
    source: 'AI Sourced',
    rating: 3,
    skills: c['skills'] ? c['skills'].split(',').map(s => s.trim()) : [],
    experience: 'Not specified',
    seniority: 'Mid/Senior',
    linkedin_url: c['url'] || ''
  }));

  const response = await fetch(SUPABASE_URL + '/rest/v1/candidates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(candidates)
  });

  if (!response.ok) {
    console.error("Supabase insert failed:", await response.text());
  } else {
    console.log(`Successfully inserted ${candidates.length} candidates into Supabase!`);
  }
}

importCsvToSupabase();
