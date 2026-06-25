import { createClient } from '@supabase/supabase-js';
import { mockClients, mockJobs, mockCandidates, mockPlacements } from './src/lib/mock-data';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Migrating clients...');
    const { error: clientErr } = await supabase.from('clients').upsert(mockClients.map(c => ({
      id: c.id,
      company_name: c.companyName,
      industry: c.industry,
      location: c.location,
      status: c.status,
      contact_person: c.contactPerson,
      email: c.email,
      open_roles: c.openRoles,
      total_placements: c.totalPlacements,
      active_since: c.activeSince,
      notes: c.notes
    })));
    if (clientErr) throw new Error(`Client error: ${clientErr.message}`);

    console.log('Migrating jobs...');
    const { error: jobsErr } = await supabase.from('jobs').upsert(mockJobs.map(j => ({
      id: j.id,
      title: j.title,
      client: j.client,
      client_id: j.clientId,
      requirements: j.requirements,
      location: j.location,
      type: j.type,
      salary: j.salary,
      status: j.status,
      priority: j.priority,
      posted_date: j.postedDate,
      applicants: j.applicants
    })));
    if (jobsErr) throw new Error(`Job error: ${jobsErr.message}`);

    console.log('Migrating candidates...');
    const { error: candErr } = await supabase.from('candidates').upsert(mockCandidates.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      location: c.location,
      role: c.role,
      company: c.company,
      status: c.status,
      source: c.source,
      rating: c.rating,
      experience: c.experience,
      seniority: c.seniority,
      last_contact: c.lastContact,
      skills: c.skills,
      linkedin_url: c.linkedinUrl,
      website_url: c.websiteUrl
    })));
    if (candErr) throw new Error(`Candidate error: ${candErr.message}`);

    console.log('Done!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

run();
