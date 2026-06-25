const fs = require('fs');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8').split('\n');
  const getEnv = (key) => env.find(l => l.startsWith(key))?.split('=')[1]?.trim();
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const SUPABASE_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  console.log("Generating 50 realistic candidates from Glasgow via Anthropic...");

  const prompt = `Generate a JSON array of exactly 50 highly realistic, authentic LinkedIn profiles of Software Engineers, Data Scientists, and UI Designers located in Glasgow, Scotland.
  
  Do not use generic names like "John Doe". Use authentic Scottish/British names.
  Make their skills, roles, and companies highly realistic for the Glasgow tech scene (e.g. JPMorgan, Barclays, Skyscanner, Morgan Stanley, local startups).
  
  Return ONLY the JSON array matching this schema:
  [
    {
      "name": "Full Name",
      "email": "email (e.g. first.last@example.com)",
      "phone": "N/A",
      "location": "Glasgow, Scotland",
      "role": "Current Title",
      "company": "Current Company",
      "status": "New",
      "source": "AI Sourced",
      "rating": 4,
      "skills": ["Skill1", "Skill2", "Skill3", "Skill4"],
      "experience": "5 years",
      "seniority": "Mid/Senior",
      "linkedinUrl": "linkedin.com/in/username"
    }
  ]
  
  Only return the JSON. No markdown formatting. No preamble.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    console.error("Anthropic failed:", await response.text());
    return;
  }

  const data = await response.json();
  let text = data.content[0].text.trim();
  if (text.startsWith('\`\`\`json')) text = text.substring(7);
  if (text.startsWith('\`\`\`')) text = text.substring(3);
  if (text.endsWith('\`\`\`')) text = text.substring(0, text.length - 3);
  
  let candidates;
  try {
    candidates = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON", e);
    return;
  }

  console.log(`Successfully generated ${candidates.length} candidates. Inserting into Supabase...`);

  // We already deleted existing candidates in previous step.

  const insertResponse = await fetch(SUPABASE_URL + '/rest/v1/candidates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(candidates.map(c => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      location: c.location,
      role: c.role,
      company: c.company,
      status: c.status,
      source: c.source,
      rating: c.rating,
      skills: c.skills,
      experience: c.experience,
      seniority: c.seniority,
      linkedin_url: c.linkedinUrl
    })))
  });

  if (!insertResponse.ok) {
    console.error("Supabase insert failed:", await insertResponse.text());
  } else {
    console.log("Successfully inserted 50 candidates into Supabase!");
  }
}

run();
