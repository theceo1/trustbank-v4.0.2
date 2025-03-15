import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';
import { quidaxService } from '@/lib/quidax';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');
    const type = searchParams.get('type');

    if (!currency || !type) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    const { data: orders, error } = await supabase
      .from('p2p_orders')
      .select(`
        *,
        creator:user_profiles(
          name,
          completed_trades,
          completion_rate
        )
      `)
      .eq('currency', currency)
      .eq('type', type)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching P2P orders:', error);
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'success', data: orders });
  } catch (error) {
    console.error('Error in P2P orders route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, currency, amount, price, payment_methods } = body;
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create P2P order
    const { data: order, error } = await supabase
      .from('p2p_orders')
      .insert({
        user_id: user.id,
        type, // 'buy' or 'sell'
        currency,
        amount,
        price,
        payment_methods,
        status: 'active',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours expiry
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      status: 'success',
      data: order
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
} 