// API: POST /api/webhooks/github - Receive GitHub webhooks

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');
    
    // In a real implementation, we would verify the webhook signature here
    // const secret = process.env.GITHUB_WEBHOOK_SECRET;
    // const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    // const expectedSignature = `sha256=${hmac}`;
    
    if (event === 'ping') {
      return NextResponse.json({ message: 'pong' });
    }

    if (event !== 'push' && event !== 'pull_request') {
      return NextResponse.json({ message: 'Ignored event type' });
    }

    const payload = JSON.parse(rawBody);
    
    // For MVP demo, we are mocking the push analysis process
    // In production, this would trigger the background push analysis agent pipeline
    console.log(`[Webhook] Received ${event} event for ${payload.repository?.full_name}`);
    
    return NextResponse.json({ message: 'Webhook received, analysis queued' }, { status: 202 });
  } catch (error) {
    console.error('[API] Error processing webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
