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

    const json = await request.json();
    const { payment_proof } = json;

    if (!payment_proof) {
      return NextResponse.json(
        { status: 'error', message: 'Payment proof is required' },
        { status: 400 }
      );
    }

    // Get trade details with order and profiles
    const { data: trade } = await supabase
      .from('p2p_trades')
      .select(`
        *,
        order:p2p_orders(*),
        buyer:profiles!p2p_trades_buyer_id_fkey(quidax_id),
        seller:profiles!p2p_trades_seller_id_fkey(quidax_id)
      `)
      .eq('id', params.id)
      .single();

    if (!trade) {
      return NextResponse.json(
        { status: 'error', message: 'Trade not found' },
        { status: 404 }
      );
    }

    // Verify buyer owns the trade
    if (trade.buyer_id !== session.user.id) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Verify trade is in pending status
    if (trade.status !== 'pending') {
      return NextResponse.json(
        { status: 'error', message: 'Trade is not in pending status' },
        { status: 400 }
      );
    }

    // Update trade with payment proof and status
    const { error: updateError } = await supabase
      .from('p2p_trades')
      .update({
        payment_proof,
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating trade:', updateError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to update trade' },
        { status: 500 }
      );
    }

    // If this is a buy order, seller needs to transfer crypto to buyer
    if (trade.order.type === 'buy') {
      try {
        // Create and confirm swap from seller to buyer
        const quotation = await quidaxService.createSwapQuotation(trade.seller.quidax_id, {
          from_currency: trade.order.currency.toLowerCase(),
          to_currency: trade.order.currency.toLowerCase(),
          from_amount: trade.crypto_amount.toString()
        });

        await quidaxService.confirmSwapQuotation(
          trade.seller.quidax_id,
          quotation.data.id
        );

        // Update trade with swap details
        await supabase
          .from('p2p_trades')
          .update({
            quidax_swap_id: quotation.data.id,
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', params.id);

        // Update completion stats
        await supabase.rpc('increment_completed_trades', {
          user_id: trade.buyer_id
        });

        await supabase.rpc('increment_completed_trades', {
          user_id: trade.seller_id
        });

        return NextResponse.json({
          status: 'success',
          data: {
            trade_id: trade.id,
            status: 'completed',
            swap_id: quotation.data.id
          }
        });
      } catch (error) {
        console.error('Error processing swap:', error);
        return NextResponse.json(
          { status: 'error', message: 'Failed to process swap' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      status: 'success',
      data: {
        trade_id: trade.id,
        status: 'paid'
      }
    });
  } catch (error) {
    console.error('Error in payment proof route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 