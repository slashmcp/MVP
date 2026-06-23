import { supabase } from './supabase';
import type { Candidate, Job, Client, Sequence } from './schemas';

export async function getCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase.from('candidates').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching candidates:', error);
    return [];
  }
  return data.map(c => ({
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
    lastContact: c.last_contact,
    skills: typeof c.skills === 'string' ? c.skills.split(',').map((s: string) => s.trim()) : (c.skills || []),
    linkedinUrl: c.linkedin_url,
    websiteUrl: c.website_url,
  }));
}

export async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
  return data.map(j => ({
    id: j.id,
    title: j.title,
    client: j.client,
    clientId: j.client_id,
    requirements: j.requirements,
    location: j.location,
    type: j.type,
    salary: j.salary,
    status: j.status,
    priority: j.priority,
    postedDate: j.posted_date,
    applicants: j.applicants,
  }));
}

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  return data.map(c => ({
    id: c.id,
    companyName: c.company_name,
    industry: c.industry,
    location: c.location,
    status: c.status,
    contactPerson: c.contact_person,
    email: c.email,
    openRoles: c.open_roles,
    totalPlacements: c.total_placements,
    activeSince: c.active_since,
    notes: c.notes,
  }));
}

export async function getSequences(): Promise<Sequence[]> {
  const { data, error } = await supabase.from('sequences').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching sequences:', error);
    return [];
  }
  return data.map(s => ({
    id: s.id,
    name: s.name,
    status: s.status,
    enrolled: s.enrolled,
    replied: s.replied,
    bounced: s.bounced,
    steps: s.steps || [],
    createdAt: s.created_at,
  }));
}

export async function createSequence(sequence: Partial<Sequence>): Promise<Sequence | null> {
  const { data, error } = await supabase.from('sequences').insert([
    {
      name: sequence.name,
      status: sequence.status || 'Draft',
      enrolled: sequence.enrolled || 0,
      replied: sequence.replied || 0,
      bounced: sequence.bounced || 0,
      steps: sequence.steps || [],
    }
  ]).select().single();

  if (error) {
    console.error('Error creating sequence:', error);
    return null;
  }
  return {
    id: data.id,
    name: data.name,
    status: data.status,
    enrolled: data.enrolled,
    replied: data.replied,
    bounced: data.bounced,
    steps: data.steps || [],
    createdAt: data.created_at,
  };
}

export async function createCandidate(candidate: Partial<Candidate>): Promise<Candidate | null> {
  const { data, error } = await supabase.from('candidates').insert([
    {
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      role: candidate.role,
      company: candidate.company,
      status: candidate.status || 'New',
      source: candidate.source,
      rating: candidate.rating || 0,
      experience: candidate.experience,
      seniority: candidate.seniority,
      last_contact: candidate.lastContact,
      skills: candidate.skills || [],
      linkedin_url: candidate.linkedinUrl,
      website_url: candidate.websiteUrl,
    }
  ]).select().single();

  if (error) {
    console.error('Error creating candidate in database:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    location: data.location,
    role: data.role,
    company: data.company,
    status: data.status,
    source: data.source,
    rating: data.rating,
    experience: data.experience,
    seniority: data.seniority,
    lastContact: data.last_contact,
    skills: data.skills || [],
    linkedinUrl: data.linkedin_url,
    websiteUrl: data.website_url,
  };
}

export async function updateCandidate(id: string, candidate: Partial<Candidate>): Promise<Candidate | null> {
  const updatePayload: any = {};
  if (candidate.name !== undefined) updatePayload.name = candidate.name;
  if (candidate.email !== undefined) updatePayload.email = candidate.email;
  if (candidate.phone !== undefined) updatePayload.phone = candidate.phone;
  if (candidate.location !== undefined) updatePayload.location = candidate.location;
  if (candidate.role !== undefined) updatePayload.role = candidate.role;
  if (candidate.company !== undefined) updatePayload.company = candidate.company;
  if (candidate.status !== undefined) updatePayload.status = candidate.status;
  if (candidate.source !== undefined) updatePayload.source = candidate.source;
  if (candidate.rating !== undefined) updatePayload.rating = candidate.rating;
  if (candidate.experience !== undefined) updatePayload.experience = candidate.experience;
  if (candidate.seniority !== undefined) updatePayload.seniority = candidate.seniority;
  if (candidate.lastContact !== undefined) updatePayload.last_contact = candidate.lastContact;
  if (candidate.skills !== undefined) updatePayload.skills = candidate.skills;
  if (candidate.linkedinUrl !== undefined) updatePayload.linkedin_url = candidate.linkedinUrl;
  if (candidate.websiteUrl !== undefined) updatePayload.website_url = candidate.websiteUrl;

  const { data, error } = await supabase
    .from('candidates')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating candidate in database:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    location: data.location,
    role: data.role,
    company: data.company,
    status: data.status,
    source: data.source,
    rating: data.rating,
    experience: data.experience,
    seniority: data.seniority,
    lastContact: data.last_contact,
    skills: data.skills || [],
    linkedinUrl: data.linkedin_url,
    websiteUrl: data.website_url,
  };
}

export async function incrementSequenceEnrollment(sequenceId: string): Promise<boolean> {
  const { data: seq, error: fetchErr } = await supabase
    .from('sequences')
    .select('enrolled')
    .eq('id', sequenceId)
    .single();

  if (fetchErr || !seq) {
    console.error('Error fetching sequence for enrollment update:', fetchErr);
    return false;
  }

  const { error: updateErr } = await supabase
    .from('sequences')
    .update({ enrolled: (seq.enrolled || 0) + 1 })
    .eq('id', sequenceId);

  if (updateErr) {
    console.error('Error updating sequence enrollment count:', updateErr);
    return false;
  }

  return true;
}

