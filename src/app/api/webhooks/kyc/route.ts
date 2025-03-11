import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { KYCService } from '@/lib/services/kyc';

const DOJAH_WEBHOOK_SECRET = process.env.DOJAH_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const signature = headersList.get('x-dojah-signature');

    if (!signature || signature !== DOJAH_WEBHOOK_SECRET) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await request.json();
    const kycService = new KYCService();

    // Handle the webhook payload
    await kycService.handleWebhook(payload);

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 