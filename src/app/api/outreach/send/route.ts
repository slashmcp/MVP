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
      return NextResponse.json(
        { error: 'Microsoft Azure Email is not fully configured in your environment variables.' },
        { status: 500 }
      );
    }

    const result = await sendEmail({
      to,
      subject,
      body: bodyText,
      isDraft,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email via Microsoft Graph' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...result,
      source: 'outlook',
    });
  } catch (error) {
    console.error('Outreach send error:', error);
    return NextResponse.json({ error: 'Failed to process email' }, { status: 500 });
  }
}
