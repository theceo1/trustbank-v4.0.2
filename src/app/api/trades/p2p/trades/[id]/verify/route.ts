import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { quidaxService } from '@/lib/quidax';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get trade details with order and profiles
    const { data: trade } = await supabase
      .from('p2p_trades')
      .select(`
        *,
        order:p2p_orders(*),
        seller:profiles!p2p_orders(quidax_id),
        buyer:profiles!p2p_trades(quidax_id)
      `)
      .eq('id', params.id)
      .single();

    if (!trade) {
      return NextResponse.json(
        { status: 'error', message: 'Trade not found' },
        { status: 404 }
      );
    }

    // Verify seller owns the order
    if (trade.order.creator_id !== session.user.id) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Verify trade is in 'paid' status
    if (trade.status !== 'paid') {
      return NextResponse.json(
        { status: 'error', message: 'Trade is not in paid status' },
        { status: 400 }
      );
    }

    try {
      // Create and confirm swap
      const quotation = await quidaxService.createSwapQuotation(trade.seller.quidax_id, {
        from_currency: trade.order.currency,
        to_currency: trade.order.currency,
        from_amount: trade.crypto_amount.toString()
      });

      const swap = await quidaxService.confirmSwapQuotation(
        trade.seller.quidax_id,
        quotation.id
      );

      // Update trade status
      const { error: updateError } = await supabase
        .from('p2p_trades')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', params.id);

      if (updateError) throw updateError;

      // Update seller's stats
      await supabase.rpc('increment_completed_trades', {
        user_id: trade.order.creator_id
      });

      // Update buyer's stats
      await supabase.rpc('increment_completed_trades', {
        user_id: trade.trader_id
      });

      return NextResponse.json({
        status: 'success',
        data: {
          trade_id: trade.id,
          swap_id: swap.id,
          status: 'completed'
        }
      });
    } catch (error) {
      console.error('Error processing swap:', error);
      return NextResponse.json(
        { status: 'error', message: 'Failed to process swap' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error verifying P2P trade:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 