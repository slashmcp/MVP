import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API Key not configured' }, { status: 401 });
    }

    const { recipient, template } = await request.json();

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient is required' }, { status: 400 });
    }

    const isClient = recipient.type === 'Client';
    
    let promptText = '';

    if (isClient) {
      promptText = `You are a professional Recruitment Consultant. Draft an outreach email to a prospective client.
Company Name: ${recipient.name}
Contact Person: ${recipient.contactPerson || 'Hiring Manager'}
Context/Notes: ${recipient.notes || 'Growing tech company'}

Write a concise, professional, and compelling cold outreach email. The goal is to get a 10-minute intro call to discuss how we can help them scale their engineering team with top-tier talent.
Do not include subject line in the body. Start directly with the greeting (e.g., Hi [Name],).
Keep it under 150 words. Be polite but direct.`;
    } else {
      promptText = `You are a professional Recruitment Consultant. Draft an outreach email to a potential candidate.
Candidate Name: ${recipient.name}
Context/Notes: ${recipient.notes || 'Strong engineering background'}

Write a concise, professional, and compelling cold outreach email. The goal is to get a 10-minute intro call to discuss an exciting unlisted opportunity that perfectly matches their background.
Do not include subject line in the body. Start directly with the greeting (e.g., Hi [Name],).
Keep it under 150 words. Make it sound exclusive and highly relevant to their skills.`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [{ role: 'user', content: promptText }],
    });

    // @ts-ignore
    const emailBody = response.content[0].text;

    return NextResponse.json({
      success: true,
      body: emailBody,
    });
  } catch (error: any) {
    console.error('Error generating email with Anthropic:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate email' }, { status: 500 });
  }
}
