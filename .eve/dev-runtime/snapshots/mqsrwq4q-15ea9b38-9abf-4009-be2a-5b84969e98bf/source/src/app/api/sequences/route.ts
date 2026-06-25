import { NextRequest, NextResponse } from 'next/server';
import { incrementSequenceEnrollment } from '@/lib/db-client';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sequenceId } = body;

    if (!sequenceId) {
      return NextResponse.json({ error: 'Sequence ID is required for updating enrollment' }, { status: 400 });
    }

    const success = await incrementSequenceEnrollment(sequenceId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update sequence enrollment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Sequence PATCH error:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
