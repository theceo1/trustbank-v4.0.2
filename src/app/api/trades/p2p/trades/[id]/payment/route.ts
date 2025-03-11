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

    // Get trade details
    const { data: trade } = await supabase
      .from('p2p_trades')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!trade) {
      return NextResponse.json(
        { status: 'error', message: 'Trade not found' },
        { status: 404 }
      );
    }

    // Verify buyer owns the trade
    if (trade.trader_id !== session.user.id) {
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