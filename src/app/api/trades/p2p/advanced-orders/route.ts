import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await request.json();
    const {
      type,
      orderSide,
      currency,
      amount,
      price,
      triggerPrice,
      expiry,
      postOnly,
    } = json;

    // Validate the order
    if (!type || !orderSide || !currency || !amount || !price || !expiry) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Insert the order into the database
    const { data: order, error } = await supabase
      .from('p2p_orders')
      .insert({
        user_id: session.user.id,
        type: orderSide,
        currency,
        amount,
        price,
        trigger_price: triggerPrice,
        expiry,
        post_only: postOnly,
        order_type: type,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating advanced order:', error);
      return new NextResponse('Error creating order', { status: 500 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error in advanced order route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 