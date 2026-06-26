import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, template, channel, name, email, role, company, skills, notes, senderName } = body;

    if (!type || !template || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sender = senderName || 'Derek';
    const isLinkedIn = channel === 'linkedin-message' || channel === 'linkedin-inmail';
    const isConnection = channel === 'linkedin-message';

    let systemPrompt = '';
    let userPrompt = '';

    // ─── CANDIDATE ────────────────────────────────────────────────────────────
    if (type === 'candidate') {
      const skillsStr = Array.isArray(skills) ? skills.slice(0, 6).join(', ') : skills || '';

      if (isLinkedIn) {
        systemPrompt = `You are ${sender}, a recruiter at Ion Recruitment in Scotland.
Write a ${isConnection ? 'LinkedIn connection request message' : 'LinkedIn InMail'}.
${isConnection
  ? 'STRICT RULES: Max 300 characters total. No subject. No "Dear" or formal greetings. Sound like a real person, not a bot. Ultra concise — 2-3 short sentences max.'
  : 'RULES: Max 400 characters for body. Include a subject line. Casual-professional tone. 3-4 sentences. No walls of text.'}
Return JSON with fields: ${isConnection ? '"body"' : '"subject" and "body"'}. No markdown. No extra text.`;

        const templates: Record<string, string> = {
          'intro': `Write a ${isConnection ? 'connection request' : 'LinkedIn InMail'} to ${name}${role ? ` who works as ${role}` : ''}${company ? ` at ${company}` : ''}${skillsStr ? `. Their skills include ${skillsStr}` : ''}. Express genuine interest in their background and open a conversation.`,
          'follow-up': `Write a ${isConnection ? 'connection request' : 'LinkedIn InMail'} to ${name}${role ? ` (${role})` : ''} as a follow-up — we may have connected or reached out before. Keep it very light, reference the previous contact subtly.`,
          'interview': `Write a ${isConnection ? 'short connection note' : 'LinkedIn InMail'} to ${name} about a potential interview opportunity. Enthusiastic but brief.`,
          'shortlist': `Write a ${isConnection ? 'connection note' : 'LinkedIn InMail'} to ${name} letting them know they've caught our attention for a great opportunity.`,
        };
        userPrompt = templates[template] || templates['intro'];

      } else {
        // Email
        systemPrompt = `You are ${sender}, a recruiter at Ion Recruitment in Scotland. 
Write professional, warm, and concise recruitment emails. 
Keep them to 3-5 sentences. No fluff, no filler. Sound human, not corporate.
Return JSON with exactly two fields: "subject" and "body". No markdown, no extra text.`;

        const templates: Record<string, string> = {
          'intro': `Write an intro outreach email to a candidate named ${name}${role ? ` who works as ${role}` : ''}${company ? ` at ${company}` : ''}${skillsStr ? ` with skills in ${skillsStr}` : ''}. Express genuine interest in their background and open a conversation about exciting opportunities.`,
          'follow-up': `Write a friendly follow-up email to ${name}${role ? ` (${role})` : ''}. We reached out before but haven't heard back. Keep it light, no pressure, just checking if they're open to a quick chat.`,
          'interview': `Write an email to ${name} inviting them to an interview. Enthusiastic and professional. Keep logistics brief.${notes ? ` Context: ${notes}` : ''}`,
          'shortlist': `Write an email to ${name} letting them know they've been shortlisted for a role${role ? ` (${role})` : ''}. Congratulatory tone, next steps are a call to discuss.`,
        };
        userPrompt = templates[template] || templates['intro'];
      }

    // ─── CLIENT ───────────────────────────────────────────────────────────────
    } else {
      if (isLinkedIn) {
        systemPrompt = `You are ${sender}, a recruiter at Ion Recruitment in Scotland.
Write a ${isConnection ? 'LinkedIn connection request' : 'LinkedIn InMail'} to a business contact or potential client.
${isConnection
  ? 'STRICT RULES: Max 300 characters total. No subject. No "Dear". Sound human. 2 sentences max. Focus on mutual value.'
  : 'RULES: Max 400 characters body. Include a subject. Professional but personable. 3-4 sentences.'}
Return JSON with fields: ${isConnection ? '"body"' : '"subject" and "body"'}. No markdown. No extra text.`;

        const templates: Record<string, string> = {
          'biz-dev': `Write a ${isConnection ? 'connection request' : 'InMail'} to ${name}${company ? ` at ${company}` : ''} introducing Ion Recruitment as a specialist recruiter. Brief and value-focused.`,
          'check-in': `Write a ${isConnection ? 'connection note' : 'InMail'} to ${name}${company ? ` at ${company}` : ''} touching base — we've worked together before or are familiar. Friendly and brief.`,
          'submit-candidate': `Write a ${isConnection ? 'connection note' : 'InMail'} to ${name}${company ? ` at ${company}` : ''} mentioning we have a strong candidate${role ? ` for their ${role} role` : ''} we'd love to discuss.`,
          'role-brief': `Write a ${isConnection ? 'connection request' : 'InMail'} to ${name}${company ? ` at ${company}` : ''} asking if they have any upcoming hiring needs we could help with.`,
        };
        userPrompt = templates[template] || templates['biz-dev'];

      } else {
        // Email
        systemPrompt = `You are ${sender}, a recruiter at Ion Recruitment in Scotland.
Write professional, concise business development and client relationship emails.
Keep them to 3-5 sentences. Sound like a trusted partner, not a cold salesperson.
Return JSON with exactly two fields: "subject" and "body". No markdown, no extra text.`;

        const templates: Record<string, string> = {
          'biz-dev': `Write a business development email to ${name}${company ? ` at ${company}` : ''}. Introduce Ion Recruitment and offer to help with their hiring needs. Be specific and relevant.`,
          'check-in': `Write a check-in email to ${name}${company ? ` at ${company}` : ''}. Touching base to see if they have upcoming hiring needs.`,
          'submit-candidate': `Write an email to ${name}${company ? ` at ${company}` : ''} to introduce a candidate for consideration${role ? ` for the ${role} role` : ''}.`,
          'role-brief': `Write an email to ${name}${company ? ` at ${company}` : ''} requesting a full role brief for a vacancy${role ? ` (${role})` : ''}.`,
        };
        userPrompt = templates[template] || templates['biz-dev'];
      }
    }

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';

    let subject = '';
    let emailBody = '';
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      subject = parsed.subject || '';
      emailBody = parsed.body || '';
    } catch {
      const subjectMatch = rawText.match(/"subject"\s*:\s*"([^"]+)"/);
      const bodyMatch = rawText.match(/"body"\s*:\s*"([\s\S]+?)"\s*}/);
      subject = subjectMatch?.[1] || '';
      emailBody = bodyMatch?.[1]?.replace(/\\n/g, '\n') || rawText;
    }

    return NextResponse.json({ subject, body: emailBody });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email draft error:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
