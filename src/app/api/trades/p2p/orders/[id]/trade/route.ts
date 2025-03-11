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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const json = await request.json();
    const { amount } = json;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Fetch the order with creator profile
    const { data: order, error: orderError } = await supabase
      .from('p2p_orders')
      .select(`
        *,
        creator:profiles(
          name,
          completed_trades,
          completion_rate
        )
      `)
      .eq('id', params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { status: 'error', message: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate order status
    if (order.status !== 'active') {
      return NextResponse.json(
        { status: 'error', message: 'Order is not active' },
        { status: 400 }
      );
    }

    // Validate amount limits
    if (amount < parseFloat(order.min_order) || amount > parseFloat(order.max_order)) {
      return NextResponse.json(
        { status: 'error', message: `Amount must be between ${order.min_order} and ${order.max_order}` },
        { status: 400 }
      );
    }

    // Prevent self-trading
    if (order.creator_id === session.user.id) {
      return NextResponse.json(
        { status: 'error', message: 'Cannot trade with yourself' },
        { status: 400 }
      );
    }

    // Calculate crypto amount based on price
    const cryptoAmount = amount / parseFloat(order.price);

    // Verify available amount
    const remainingAmount = parseFloat(order.amount);
    if (cryptoAmount > remainingAmount) {
      return NextResponse.json(
        { status: 'error', message: 'Insufficient order amount available' },
        { status: 400 }
      );
    }

    // Create the trade
    const { data: trade, error: tradeError } = await supabase
      .from('p2p_trades')
      .insert([
        {
          order_id: params.id,
          trader_id: session.user.id,
          amount: amount.toString(),
          crypto_amount: cryptoAmount.toString(),
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (tradeError) {
      console.error('Error creating P2P trade:', tradeError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to create trade' },
        { status: 500 }
      );
    }

    // Update order amount
    const { error: updateError } = await supabase
      .from('p2p_orders')
      .update({
        amount: (remainingAmount - cryptoAmount).toString()
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating order amount:', updateError);
      // Don't return error since trade is already created
    }

    return NextResponse.json({
      status: 'success',
      data: {
        ...trade,
        order: {
          ...order,
          payment_methods: order.payment_methods,
          terms: order.terms
        }
      }
    });
  } catch (error) {
    console.error('Error in P2P trade route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 