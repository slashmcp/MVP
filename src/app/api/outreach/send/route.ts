import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, isOutlookConfigured } from '@/lib/outlook';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, bodyText, isDraft } = body;

    if (!to || !subject || !bodyText) {
      return NextResponse.json(
        { error: 'to, subject, and bodyText are required' },
        { status: 400 }
      );
    }

    if (!isOutlookConfigured()) {
      return NextResponse.json({
        success: true,
        source: 'mock',
        message: isDraft
          ? 'Draft saved (mock mode — configure Outlook for real emails)'
          : 'Email sent (mock mode — configure Outlook for real emails)',
        messageId: `mock-${Date.now()}`,
      });
    }

    const result = await sendEmail({
      to,
      subject,
      body: bodyText,
      isDraft,
    });

    return NextResponse.json({
      ...result,
      source: 'outlook',
    });
  } catch (error) {
    console.error('Outreach send error:', error);
    return NextResponse.json({ error: 'Failed to process email' }, { status: 500 });
  }
}
