import type { SupabaseClient } from '@supabase/supabase-js';
import type { Candidate, Job, Client, Sequence } from './schemas';

// db-client functions now accept an authenticated Supabase client (from @supabase/ssr)
// so that Supabase RLS policies are enforced — each user only sees their org's data.

function updateContactDetailsInNotes(
  existingNotes: string | undefined | null,
  phone: string | undefined | null,
  websiteUrl: string | undefined | null,
  linkedinUrl: string | undefined | null,
  googleRating?: string | number | null,
  reviewCount?: string | number | null,
  instagramUrl?: string | null,
  facebookUrl?: string | null,
  twitterUrl?: string | null,
  youtubeUrl?: string | null,
  mapsUrl?: string | null
): string {
  let notes = existingNotes || '';

  // Clean existing contact details block and any phone/website/linkedin lines
  const lines = notes.split('\n');
  const cleanedLines = [];
  let inContactBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase() === 'contact details:') {
      inContactBlock = true;
      continue;
    }
    if (
      line.toLowerCase().startsWith('phone:') ||
      line.toLowerCase().startsWith('linkedin:') ||
      line.toLowerCase().startsWith('website:') ||
      line.toLowerCase().startsWith('website/linkedin:') ||
      line.toLowerCase().startsWith('google rating:') ||
      line.toLowerCase().startsWith('review count:') ||
      line.toLowerCase().startsWith('instagram:') ||
      line.toLowerCase().startsWith('facebook:') ||
      line.toLowerCase().startsWith('twitter:') ||
      line.toLowerCase().startsWith('youtube:') ||
      line.toLowerCase().startsWith('maps:')
    ) {
      continue;
    }
    if (inContactBlock && line === '') {
      continue;
    }
    inContactBlock = false;
    cleanedLines.push(lines[i]);
  }

  notes = cleanedLines.join('\n').trim();

  // Create new contact block
  const notesParts: string[] = [];
  if (phone && phone !== 'N/A') notesParts.push(`Phone: ${phone}`);
  if (websiteUrl && websiteUrl !== 'N/A') notesParts.push(`Website: ${websiteUrl}`);
  if (linkedinUrl && linkedinUrl !== 'N/A') notesParts.push(`LinkedIn: ${linkedinUrl}`);
  if (googleRating) notesParts.push(`Google Rating: ${googleRating}`);
  if (reviewCount) notesParts.push(`Review Count: ${reviewCount}`);
  if (instagramUrl) notesParts.push(`Instagram: ${instagramUrl}`);
  if (facebookUrl) notesParts.push(`Facebook: ${facebookUrl}`);
  if (twitterUrl) notesParts.push(`Twitter: ${twitterUrl}`);
  if (youtubeUrl) notesParts.push(`YouTube: ${youtubeUrl}`);
  if (mapsUrl) notesParts.push(`Maps: ${mapsUrl}`);

  if (notesParts.length > 0) {
    const contactBlock = `Contact details:\n${notesParts.join('\n')}`;
    notes = notes ? `${notes}\n\n${contactBlock}` : contactBlock;
  }

  return notes;
}

function parseContactDetailsFromNotes(notes: string | undefined | null) {
  let phone = undefined;
  let linkedinUrl = undefined;
  let websiteUrl = undefined;
  let googleRating = undefined;
  let reviewCount = undefined;
  let instagramUrl = undefined;
  let facebookUrl = undefined;
  let twitterUrl = undefined;
  let youtubeUrl = undefined;
  let mapsUrl = undefined;

  if (notes) {
    const phoneMatch = notes.match(/Phone:\s*([^\n\r]+)/i);
    if (phoneMatch) phone = phoneMatch[1].trim();

    const linkedinMatch = notes.match(/LinkedIn:\s*([^\n\r]+)/i);
    if (linkedinMatch) {
      const val = linkedinMatch[1].trim();
      if (val.includes('linkedin.com')) {
        linkedinUrl = val;
      }
    }

    const websiteMatch = notes.match(/Website:\s*([^\n\r]+)/i);
    if (websiteMatch) websiteUrl = websiteMatch[1].trim();

    const webLinkMatch = notes.match(/Website\/LinkedIn:\s*([^\n\r]+)/i);
    if (webLinkMatch) {
      const val = webLinkMatch[1].trim();
      if (val.includes('linkedin.com')) {
        if (!linkedinUrl) linkedinUrl = val;
      } else {
        if (!websiteUrl) websiteUrl = val;
      }
    }

    const grMatch = notes.match(/Google Rating:\s*([^\n\r]+)/i);
    if (grMatch) googleRating = grMatch[1].trim();

    const rcMatch = notes.match(/Review Count:\s*([^\n\r]+)/i);
    if (rcMatch) reviewCount = rcMatch[1].trim();

    const igMatch = notes.match(/Instagram:\s*([^\n\r]+)/i);
    if (igMatch) instagramUrl = igMatch[1].trim();

    const fbMatch = notes.match(/Facebook:\s*([^\n\r]+)/i);
    if (fbMatch) facebookUrl = fbMatch[1].trim();

    const twMatch = notes.match(/Twitter:\s*([^\n\r]+)/i);
    if (twMatch) twitterUrl = twMatch[1].trim();

    const ytMatch = notes.match(/YouTube:\s*([^\n\r]+)/i);
    if (ytMatch) youtubeUrl = ytMatch[1].trim();

    const mapsMatch = notes.match(/Maps:\s*([^\n\r]+)/i);
    if (mapsMatch) mapsUrl = mapsMatch[1].trim();
  }

  return { phone, linkedinUrl, websiteUrl, googleRating, reviewCount, instagramUrl, facebookUrl, twitterUrl, youtubeUrl, mapsUrl };
}

export async function getCandidates(supabase: SupabaseClient): Promise<Candidate[]> {
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
    notes: c.notes,
    resume: c.resume_url,
    createdAt: c.created_at,
  }));
}

export async function getJobs(supabase: SupabaseClient): Promise<Job[]> {
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
    createdAt: j.created_at,
  }));
}

export async function getClients(supabase: SupabaseClient): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  return data.map(c => {
    const contacts = parseContactDetailsFromNotes(c.notes);
    return {
      id: c.id,
      companyName: c.company_name,
      industry: c.industry,
      location: c.location,
      status: c.status,
      contactPerson: c.contact_person,
      email: c.email,
      phone: contacts.phone,
      linkedinUrl: contacts.linkedinUrl,
      websiteUrl: contacts.websiteUrl,
      openRoles: c.open_roles,
      totalPlacements: c.total_placements,
      activeSince: c.active_since,
      notes: c.notes,
      createdAt: c.created_at,
    };
  });
}

export async function getSequences(supabase: SupabaseClient): Promise<Sequence[]> {
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

export async function createSequence(supabase: SupabaseClient, sequence: Partial<Sequence>): Promise<Sequence | null> {
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

export async function createCandidate(supabase: SupabaseClient, candidate: Partial<Candidate>): Promise<Candidate | null> {
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
      notes: candidate.notes,
      resume_url: candidate.resume,
      org_id: '4d02e02b-f8f6-450a-a3ea-07f356e3f684', // Fallback for backend API routes without full session auth
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
    notes: data.notes,
    resume: data.resume_url,
    createdAt: data.created_at,
  };
}

export async function updateCandidate(supabase: SupabaseClient, id: string, candidate: Partial<Candidate>): Promise<Candidate | null> {
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
  if (candidate.notes !== undefined) updatePayload.notes = candidate.notes;
  if (candidate.resume !== undefined) updatePayload.resume_url = candidate.resume;

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
    notes: data.notes,
    resume: data.resume_url,
  };
}

export async function incrementSequenceEnrollment(supabase: SupabaseClient, sequenceId: string): Promise<boolean> {
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

export async function createClient(supabase: SupabaseClient, clientData: Partial<Client>): Promise<Client | null> {
  const finalNotes = updateContactDetailsInNotes(
    clientData.notes,
    clientData.phone,
    clientData.websiteUrl,
    clientData.linkedinUrl,
    clientData.googleRating,
    clientData.reviewCount,
    clientData.instagramUrl,
    clientData.facebookUrl,
    clientData.twitterUrl,
    clientData.youtubeUrl,
    clientData.mapsUrl
  );

  const { data, error } = await supabase.from('clients').insert([
    {
      company_name: clientData.companyName,
      contact_person: clientData.contactPerson,
      email: clientData.email,
      location: clientData.location,
      industry: clientData.industry,
      status: clientData.status || 'Active',
      open_roles: clientData.openRoles || 0,
      total_placements: clientData.totalPlacements || 0,
      notes: finalNotes,
    }
  ]).select().single();

  if (error) {
    console.error('Error creating client in database:', error);
    return null;
  }

  const contacts = parseContactDetailsFromNotes(data.notes);

  return {
    id: data.id,
    companyName: data.company_name,
    contactPerson: data.contact_person,
    email: data.email,
    phone: contacts.phone,
    location: data.location,
    industry: data.industry,
    status: data.status,
    linkedinUrl: contacts.linkedinUrl,
    websiteUrl: contacts.websiteUrl,
    googleRating: contacts.googleRating,
    reviewCount: contacts.reviewCount,
    instagramUrl: contacts.instagramUrl,
    facebookUrl: contacts.facebookUrl,
    twitterUrl: contacts.twitterUrl,
    youtubeUrl: contacts.youtubeUrl,
    mapsUrl: contacts.mapsUrl,
    openRoles: data.open_roles,
    totalPlacements: data.total_placements,
    notes: data.notes,
  };
}

export async function updateClient(supabase: SupabaseClient, id: string, clientData: Partial<Client>): Promise<Client | null> {
  // Load current client's notes to preserve existing values if they are not updated
  const { data: currentClient } = await supabase
    .from('clients')
    .select('notes')
    .eq('id', id)
    .single();

  const currentNotes = currentClient?.notes || '';
  const currentContacts = parseContactDetailsFromNotes(currentNotes);

  const finalPhone = clientData.phone !== undefined ? clientData.phone : currentContacts.phone;
  const finalWebsite = clientData.websiteUrl !== undefined ? clientData.websiteUrl : currentContacts.websiteUrl;
  const finalLinkedin = clientData.linkedinUrl !== undefined ? clientData.linkedinUrl : currentContacts.linkedinUrl;
  const finalNotes = clientData.notes !== undefined ? clientData.notes : currentNotes;

  const finalGoogleRating = clientData.googleRating !== undefined ? clientData.googleRating : currentContacts.googleRating;
  const finalReviewCount = clientData.reviewCount !== undefined ? clientData.reviewCount : currentContacts.reviewCount;
  const finalInstagram = clientData.instagramUrl !== undefined ? clientData.instagramUrl : currentContacts.instagramUrl;
  const finalFacebook = clientData.facebookUrl !== undefined ? clientData.facebookUrl : currentContacts.facebookUrl;
  const finalTwitter = clientData.twitterUrl !== undefined ? clientData.twitterUrl : currentContacts.twitterUrl;
  const finalYoutube = clientData.youtubeUrl !== undefined ? clientData.youtubeUrl : currentContacts.youtubeUrl;
  const finalMaps = clientData.mapsUrl !== undefined ? clientData.mapsUrl : currentContacts.mapsUrl;

  const updatedNotes = updateContactDetailsInNotes(
    finalNotes,
    finalPhone,
    finalWebsite,
    finalLinkedin,
    finalGoogleRating,
    finalReviewCount,
    finalInstagram,
    finalFacebook,
    finalTwitter,
    finalYoutube,
    finalMaps
  );

  const updatePayload: any = {};
  if (clientData.companyName !== undefined) updatePayload.company_name = clientData.companyName;
  if (clientData.contactPerson !== undefined) updatePayload.contact_person = clientData.contactPerson;
  if (clientData.email !== undefined) updatePayload.email = clientData.email;
  if (clientData.location !== undefined) updatePayload.location = clientData.location;
  if (clientData.industry !== undefined) updatePayload.industry = clientData.industry;
  if (clientData.status !== undefined) updatePayload.status = clientData.status;
  if (clientData.openRoles !== undefined) updatePayload.open_roles = clientData.openRoles;
  updatePayload.notes = updatedNotes;

  const { data, error } = await supabase
    .from('clients')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client in database:', error);
    return null;
  }

  const contacts = parseContactDetailsFromNotes(data.notes);

  return {
    id: data.id,
    companyName: data.company_name,
    contactPerson: data.contact_person,
    email: data.email,
    phone: contacts.phone,
    location: data.location,
    industry: data.industry,
    status: data.status,
    linkedinUrl: contacts.linkedinUrl,
    websiteUrl: contacts.websiteUrl,
    googleRating: contacts.googleRating,
    reviewCount: contacts.reviewCount,
    instagramUrl: contacts.instagramUrl,
    facebookUrl: contacts.facebookUrl,
    twitterUrl: contacts.twitterUrl,
    youtubeUrl: contacts.youtubeUrl,
    mapsUrl: contacts.mapsUrl,
    openRoles: data.open_roles,
    totalPlacements: data.total_placements,
    notes: data.notes,
  };
}

export async function createJob(supabase: SupabaseClient, jobData: Partial<Job>): Promise<Job | null> {
  const { data, error } = await supabase.from('jobs').insert([
    {
      title: jobData.title,
      client: jobData.client,
      client_id: jobData.clientId,
      requirements: Array.isArray(jobData.requirements) ? jobData.requirements.join(', ') : jobData.requirements,
      location: jobData.location,
      type: jobData.type,
      salary: jobData.salary,
      status: jobData.status || 'Open',
      priority: jobData.priority || 'Medium',
      posted_date: jobData.postedDate || new Date().toISOString(),
      applicants: jobData.applicants || 0,
    }
  ]).select().single();

  if (error) {
    console.error('Error creating job in database:', error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    client: data.client,
    clientId: data.client_id,
    requirements: data.requirements,
    location: data.location,
    type: data.type,
    salary: data.salary,
    status: data.status,
    priority: data.priority,
    postedDate: data.posted_date,
    applicants: data.applicants,
  };
}

export async function deleteClient(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) {
    console.error('Error deleting client:', error);
    return false;
  }
  return true;
}

export async function deleteClients(supabase: SupabaseClient, ids: string[]): Promise<boolean> {
  const { error } = await supabase.from('clients').delete().in('id', ids);
  if (error) {
    console.error('Error bulk deleting clients:', error);
    return false;
  }
  return true;
}

export async function deleteCandidate(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { error } = await supabase.from('candidates').delete().eq('id', id);
  if (error) {
    console.error('Error deleting candidate:', error);
    return false;
  }
  return true;
}

export async function deleteCandidates(supabase: SupabaseClient, ids: string[]): Promise<boolean> {
  const { error } = await supabase.from('candidates').delete().in('id', ids);
  if (error) {
    console.error('Error bulk deleting candidates:', error);
    return false;
  }
  return true;
}

export async function deleteJob(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) {
    console.error('Error deleting job:', error);
    return false;
  }
  return true;
}

export async function deleteJobs(supabase: SupabaseClient, ids: string[]): Promise<boolean> {
  const { error } = await supabase.from('jobs').delete().in('id', ids);
  if (error) {
    console.error('Error bulk deleting jobs:', error);
    return false;
  }
  return true;
}


