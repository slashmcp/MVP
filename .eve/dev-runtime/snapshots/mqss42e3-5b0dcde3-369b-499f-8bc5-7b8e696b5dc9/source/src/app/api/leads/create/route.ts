import { NextResponse } from 'next/server';
import { createClient, createJob } from '@/lib/db-client';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { companyName, location, jobTitle, description } = data;

    if (!companyName || !jobTitle) {
      return NextResponse.json({ error: 'Company and Job Title required' }, { status: 400 });
    }

    // 1. Create the Client (Lead)
    const newClient = await createClient({
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
    const newJob = await createJob({
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
