const fs = require('fs');
const { faker } = require('@faker-js/faker');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8').split('\n');
  const getEnv = (key) => env.find(l => l.startsWith(key))?.split('=')[1]?.trim();
  const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const SUPABASE_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const techCompanies = ['Skyscanner', 'JPMorgan', 'Barclays', 'Morgan Stanley', 'FreeAgent', 'FanDuel', 'Cirrus Logic', 'Ogilvy', 'Local Startup'];
  const titles = ['Senior Frontend Engineer', 'Full Stack Developer', 'Data Scientist', 'UI/UX Designer', 'Backend Engineer', 'DevOps Engineer', 'React Developer', 'Software Engineer'];
  const skillsPool = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'GraphQL', 'TailwindCSS', 'Figma', 'SQL', 'PostgreSQL', 'Vue.js'];

  const candidates = [];
  for (let i = 0; i < 50; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const domain = faker.internet.domainName();
    
    // Pick 3-5 random skills
    const numSkills = faker.number.int({ min: 3, max: 5 });
    const skills = faker.helpers.arrayElements(skillsPool, numSkills);

    candidates.push({
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName, provider: domain }).toLowerCase(),
      phone: faker.phone.number({ style: 'international' }),
      location: 'Glasgow, Scotland',
      role: faker.helpers.arrayElement(titles),
      company: faker.helpers.arrayElement(techCompanies),
      status: faker.helpers.arrayElement(['New', 'Contacted', 'Engaged']),
      source: 'AI Sourced',
      rating: faker.number.int({ min: 3, max: 5 }),
      skills: skills,
      experience: `${faker.number.int({ min: 2, max: 10 })} years`,
      seniority: faker.helpers.arrayElement(['Mid', 'Senior', 'Lead']),
      linkedin_url: `linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${faker.string.alphanumeric(4)}`
    });
  }

  const insertResponse = await fetch(SUPABASE_URL + '/rest/v1/candidates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(candidates)
  });

  if (!insertResponse.ok) {
    console.error("Supabase insert failed:", await insertResponse.text());
  } else {
    console.log(`Successfully seeded ${candidates.length} candidates!`);
  }
}

run();
