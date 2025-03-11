import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { quidaxService } from '@/lib/quidax';

export async function POST(request: Request) {
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
    const { market, side, ord_type, price, volume } = json;

    // Validate required fields
    if (!market || !side || !ord_type || !volume) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate order type and price
    if (ord_type === 'limit' && !price) {
      return NextResponse.json(
        { status: 'error', message: 'Price is required for limit orders' },
        { status: 400 }
      );
    }

    // Get user's Quidax ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('quidax_id')
      .eq('user_id', session.user.id)
      .single();

    if (!profile?.quidax_id) {
      return NextResponse.json(
        { status: 'error', message: 'Profile not found' },
        { status: 404 }
      );
    }

    // Create order on Quidax
    try {
      const order = await quidaxService.createOrder({
        market,
        side,
        ord_type,
        price: ord_type === 'limit' ? price : undefined,
        volume,
        user_id: profile.quidax_id
      });

      // Store order in database for tracking
      const { error: dbError } = await supabase
        .from('spot_orders')
        .insert({
          user_id: session.user.id,
          quidax_order_id: order.id,
          market,
          side,
          order_type: ord_type,
          price: price || null,
          volume,
          status: order.state
        });

      if (dbError) {
        console.error('Error storing order:', dbError);
        // Don't return error since order was created successfully on Quidax
      }

      return NextResponse.json({
        status: 'success',
        data: order
      });
    } catch (error: any) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: error.message || 'Failed to create order'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing spot order:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 