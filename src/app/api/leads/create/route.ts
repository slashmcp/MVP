import { NextResponse } from 'next/server';
import { createClient as createClientRecord, createJob } from '@/lib/db-client';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { companyName, location, jobTitle, description } = data;

    if (!companyName || !jobTitle) {
      return NextResponse.json({ error: 'Company and Job Title required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Create the Client (Lead)
    const newClient = await createClientRecord(supabase, {
      companyName,
      location: location || 'Unknown',
      status: 'Prospect',
      openRoles: 1,
      notes: 'Sourced from Vacancy Search',
    });

    if (!newClient) {
      throw new Error('Failed to create client');
    }

    // 2. Create the Job under that Client
    const newJob = await createJob(supabase, {
      title: jobTitle,
      client: companyName,
      clientId: newClient.id,
      location: location || 'Unknown',
      requirements: description ? [description] : [],
      status: 'Open',
    });

    if (!newJob) {
      throw new Error('Failed to create job');
    }

    return NextResponse.json({ success: true, client: newClient, job: newJob });
  } catch (error: any) {
    console.error('Add lead error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add lead to CRM' },
      { status: 500 }
    );
  }
}
