import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

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
    const { reason, evidence } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Dispute reason is required' }, { status: 400 });
    }

    // Get trade details
    const { data: trade, error: tradeError } = await supabase
      .from('p2p_trades')
      .select('*, escrow:p2p_escrows(*)')
      .eq('id', params.id)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Verify user is involved in the trade
    if (trade.buyer_id !== user.id && trade.seller_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to dispute this trade' }, { status: 403 });
    }

    // Verify trade can be disputed
    if (!['pending_payment', 'paid'].includes(trade.status)) {
      return NextResponse.json({ error: 'Trade cannot be disputed in current status' }, { status: 400 });
    }

    // Create dispute record
    const { data: dispute, error: disputeError } = await supabase
      .from('p2p_disputes')
      .insert({
        trade_id: params.id,
        initiator_id: user.id,
        reason,
        evidence,
        status: 'pending'
      })
      .select()
      .single();

    if (disputeError) {
      return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 });
    }

    // Update trade status
    const { error: updateError } = await supabase
      .from('p2p_trades')
      .update({
        status: 'disputed'
      })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update trade status' }, { status: 500 });
    }

    // Update escrow status
    const { error: escrowError } = await supabase
      .from('p2p_escrows')
      .update({
        status: 'disputed'
      })
      .eq('id', trade.escrow_id);

    if (escrowError) {
      return NextResponse.json({ error: 'Failed to update escrow status' }, { status: 500 });
    }

    // Notify admin and other party
    // TODO: Implement notification system

    return NextResponse.json({
      success: true,
      data: {
        dispute_id: dispute.id,
        trade_id: params.id,
        status: 'disputed'
      }
    });

  } catch (error) {
    console.error('P2P trade dispute error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 