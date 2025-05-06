import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  // Respond with 200 as soon as possible for KoraPay reliability
  let responded = false;
  const respondOk = () => {
    responded = true;
    return new Response('ok', { status: 200 });
  };

  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const rawBody = await request.text();
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const signature = request.headers.get('x-korapay-signature');
    const secret = process.env.KORAPAY_SECRET_KEY;
    if (!signature || !secret) {
      return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
    }
    // Compute HMAC SHA256 of ONLY the data object
    const dataStr = JSON.stringify(event.data);
    const hash = crypto.createHmac('sha256', secret).update(dataStr).digest('hex');
    if (hash !== signature) {
      // Invalid signature, ignore
      return respondOk();
    }
    // Idempotency: check if we've already processed this webhook event
    const { reference, status, amount } = event.data || {};
    if (!reference || !status) {
      return respondOk();
    }
    // Find the transaction by reference
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .single();
    if (txError || !tx) {
      return respondOk();
    }
    // If already processed (status is already final), ignore
    if (tx.status === 'success' || tx.status === 'failed') {
      return respondOk();
    }
    // Update transaction status and log event
    await supabase
      .from('transactions')
      .update({ status, metadata: { ...tx.metadata, korapay_event: event } })
      .eq('reference', reference);
    // For deposits: if successful, credit the user's NGN wallet
    if (tx.type === 'deposit' && status === 'success') {
      // Credit wallet only if not already credited
      await supabase.rpc('credit_wallet', {
        user_id: tx.user_id,
        wallet: 'ngn_wallet',
        amount: Number(amount)
      });
    }
    // For withdrawals: if failed, consider refunding; if success, mark as complete
    // (Add custom logic as needed)
    return respondOk();
  } catch (error: any) {
    console.error('KoraPay webhook error:', error);
    if (!responded) {
      return new Response('ok', { status: 200 });
    }
  }
}
