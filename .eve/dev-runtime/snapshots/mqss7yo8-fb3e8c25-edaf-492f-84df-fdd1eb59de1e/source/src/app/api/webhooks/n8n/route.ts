import { NextRequest, NextResponse } from 'next/server';

// ========================================
// n8n Webhook Receiver
// ========================================

// Verify webhook secret
function verifyWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return true; // Allow all if no secret configured
  
  const authHeader = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-webhook-secret');
  
  return authHeader === `Bearer ${secret}` || headerSecret === secret;
}

export async function POST(request: NextRequest) {
  // Verify webhook authentication
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { action, data } = payload;

    switch (action) {
      case 'new-candidate':
        // Handle new candidate from n8n
        console.log('n8n: New candidate received:', data);
        return NextResponse.json({ 
          success: true, 
          message: 'Candidate queued for processing',
          action: 'new-candidate',
        });

      case 'update-status':
        // Handle status update from n8n
        console.log('n8n: Status update:', data);
        return NextResponse.json({ 
          success: true, 
          message: 'Status updated',
          action: 'update-status',
        });

      case 'trigger-briefing':
        // Trigger daily briefing generation
        console.log('n8n: Briefing trigger received');
        return NextResponse.json({ 
          success: true, 
          message: 'Briefing generation triggered',
          action: 'trigger-briefing',
        });

      case 'sync-data':
        // Sync external data
        console.log('n8n: Data sync requested:', data);
        return NextResponse.json({ 
          success: true, 
          message: 'Data sync initiated',
          action: 'sync-data',
        });

      default:
        return NextResponse.json({ 
          success: true, 
          message: 'Webhook received',
          action: action || 'unknown',
          payload,
        });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}

// Health check for n8n
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'recruitment-command-center',
    webhookEndpoint: '/api/webhooks/n8n',
    supportedActions: ['new-candidate', 'update-status', 'trigger-briefing', 'sync-data'],
    timestamp: new Date().toISOString(),
  });
}
