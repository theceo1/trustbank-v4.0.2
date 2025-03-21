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
    if (trade.status !== 'paid') {
      return NextResponse.json({ error: 'Trade is not in paid status' }, { status: 400 });
    }

    // Verify user is the seller
    if (trade.seller_id !== user.id) {
      return NextResponse.json({ error: 'Only seller can complete trade' }, { status: 403 });
    }

    // Update trade status
    const { error: updateError } = await supabase
      .from('p2p_trades')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update trade status' }, { status: 500 });
    }

    // Update escrow status
    const { error: escrowError } = await supabase
      .from('p2p_escrows')
      .update({
        status: 'completed'
      })
      .eq('id', trade.escrow_id);

    if (escrowError) {
      return NextResponse.json({ error: 'Failed to update escrow status' }, { status: 500 });
    }

    // Update order status if all amount is traded
    const { data: remainingAmount } = await supabase
      .from('p2p_trades')
      .select('amount')
      .eq('order_id', trade.order_id)
      .eq('status', 'completed')
      .select('sum(amount)');

    if (remainingAmount && remainingAmount[0].sum >= trade.order.amount) {
      const { error: orderError } = await supabase
        .from('p2p_orders')
        .update({ status: 'completed' })
        .eq('id', trade.order_id);

      if (orderError) {
        console.error('Failed to update order status:', orderError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        trade_id: params.id,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('P2P trade completion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 