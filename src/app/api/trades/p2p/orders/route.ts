import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
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
        creator:profiles(
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
    const {
      type,
      currency,
      price,
      amount,
      min_order,
      max_order,
      payment_methods,
      terms,
    } = json;

    // Validate required fields
    if (!type || !currency || !price || !amount || !min_order || !max_order || !payment_methods || !terms) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
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

    // Check seller's balance for sell orders
    if (type === 'sell') {
      try {
        const wallet = await quidaxService.getWallet(profile.quidax_id, currency);
        const available = parseFloat(wallet.balance);
        const required = parseFloat(amount);

        if (available < required) {
          return NextResponse.json(
            { 
              status: 'error', 
              message: `Insufficient ${currency} balance. Available: ${available}, Required: ${required}` 
            },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Error checking wallet balance:', error);
        return NextResponse.json(
          { status: 'error', message: 'Failed to verify balance' },
          { status: 500 }
        );
      }
    }

    // Create the order
    const { data: order, error } = await supabase
      .from('p2p_orders')
      .insert([
        {
          creator_id: session.user.id,
          type,
          currency,
          price,
          amount,
          min_order,
          max_order,
          payment_methods,
          terms,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating P2P order:', error);
      return NextResponse.json(
        { status: 'error', message: 'Failed to create order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error in P2P orders route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 