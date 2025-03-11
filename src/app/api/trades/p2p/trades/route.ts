import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, amount } = body;
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Start transaction
    const { data: order } = await supabase
      .from('p2p_orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot trade with your own order' },
        { status: 400 }
      );
    }

    // Create escrow
    const { data: escrow, error: escrowError } = await supabase
      .from('p2p_escrows')
      .insert({
        order_id,
        buyer_id: order.type === 'sell' ? user.id : order.user_id,
        seller_id: order.type === 'sell' ? order.user_id : user.id,
        amount,
        price: order.price,
        total: parseFloat(amount) * parseFloat(order.price),
        status: 'pending_payment',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes to complete payment
      })
      .select()
      .single();

    if (escrowError) throw escrowError;

    // Create trade
    const { data: trade, error: tradeError } = await supabase
      .from('p2p_trades')
      .insert({
        order_id,
        escrow_id: escrow.id,
        buyer_id: escrow.buyer_id,
        seller_id: escrow.seller_id,
        amount,
        price: order.price,
        total: escrow.total,
        status: 'pending_payment',
      })
      .select()
      .single();

    if (tradeError) throw tradeError;

    return NextResponse.json({
      status: 'success',
      data: {
        trade,
        escrow
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
} 