import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trade_id, reason, evidence } = body;
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get trade details
    const { data: trade } = await supabase
      .from('p2p_trades')
      .select('*')
      .eq('id', trade_id)
      .single();

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Verify user is part of the trade
    if (trade.buyer_id !== user.id && trade.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to open dispute for this trade' },
        { status: 403 }
      );
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabase
      .from('p2p_disputes')
      .insert({
        trade_id,
        initiator_id: user.id,
        respondent_id: user.id === trade.buyer_id ? trade.seller_id : trade.buyer_id,
        reason,
        evidence,
        status: 'open',
      })
      .select()
      .single();

    if (disputeError) throw disputeError;

    // Update trade status
    const { error: tradeError } = await supabase
      .from('p2p_trades')
      .update({ status: 'disputed' })
      .eq('id', trade_id);

    if (tradeError) throw tradeError;

    return NextResponse.json({
      status: 'success',
      data: dispute
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
} 