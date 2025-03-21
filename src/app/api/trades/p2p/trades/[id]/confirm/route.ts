import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { QuidaxService } from '@/lib/quidax';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(authHeader.split(' ')[1]);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { payment_proof } = body;

    if (!payment_proof) {
      return NextResponse.json({ error: 'Payment proof is required' }, { status: 400 });
    }

    // Get trade details
    const { data: trade, error: tradeError } = await supabase
      .from('p2p_trades')
      .select('*, escrow:p2p_escrows(*), order:p2p_orders(*)')
      .eq('id', params.id)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Verify trade status
    if (trade.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Trade is not in pending payment status' }, { status: 400 });
    }

    // Verify user is the buyer
    if (trade.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Only buyer can confirm payment' }, { status: 403 });
    }

    // Verify escrow hasn't expired
    if (new Date(trade.escrow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Trade escrow has expired' }, { status: 400 });
    }

    // Update trade status
    const { error: updateError } = await supabase
      .from('p2p_trades')
      .update({
        status: 'paid',
        payment_proof,
        paid_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update trade status' }, { status: 500 });
    }

    // Update escrow status
    const { error: escrowError } = await supabase
      .from('p2p_escrows')
      .update({
        status: 'paid',
        payment_confirmed_at: new Date().toISOString()
      })
      .eq('id', trade.escrow_id);

    if (escrowError) {
      return NextResponse.json({ error: 'Failed to update escrow status' }, { status: 500 });
    }

    // Initialize Quidax service
    const quidax = new QuidaxService(process.env.QUIDAX_API_URL, process.env.QUIDAX_SECRET_KEY);

    // Release funds from escrow to seller
    const escrowResponse = await quidax.transferToSubAccount(process.env.QUIDAX_ESCROW_WALLET_ID!, {
      currency: trade.order.currency,
      amount: trade.amount.toString(),
      fund_uid: trade.seller_quidax_id,
      transaction_note: `P2P trade settlement for trade ${params.id}`,
      narration: 'P2P trade settlement'
    });

    if (!escrowResponse.success) {
      // Log error but don't fail the request - manual intervention may be needed
      console.error('Failed to release escrow funds:', escrowResponse.error);
    }

    return NextResponse.json({
      success: true,
      data: {
        trade_id: params.id,
        status: 'paid'
      }
    });

  } catch (error) {
    console.error('P2P trade payment confirmation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 