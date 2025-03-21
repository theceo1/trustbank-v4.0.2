import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';
import { QuidaxService } from '@/lib/quidax';

export async function POST(request: Request) {
  try {
    // Check Authorization header first
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    }, {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Get user from token
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
    
    if (tokenError || !user) {
      console.error('Token error:', tokenError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { type, currency, amount, price, min_order, max_order, payment_methods, terms } = body;

    // Validate required parameters
    if (!type || !currency || !amount || !price || !payment_methods) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get user's Quidax ID from profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.quidax_id) {
      return NextResponse.json(
        { error: 'Trading account not found' },
        { status: 404 }
      );
    }

    // For sell orders, verify user has sufficient balance
    if (type === 'sell') {
      const quidaxService = new QuidaxService();
      const wallet = await quidaxService.getWallet(profile.quidax_id, currency);
      const balance = parseFloat(wallet.data.balance);

      if (balance < parseFloat(amount)) {
        return NextResponse.json(
          { error: `Insufficient ${currency.toUpperCase()} balance` },
          { status: 400 }
        );
      }
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('p2p_orders')
      .insert({
        creator_id: user.id,
        type,
        currency: currency.toLowerCase(),
        amount,
        price,
        min_order: min_order || amount,
        max_order: max_order || amount,
        payment_methods,
        terms,
        status: 'active',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating P2P order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: order
    });

  } catch (error) {
    console.error('Error in P2P orders endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    }, {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
    
    if (tokenError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'buy' | 'sell' | null;
    const currency = searchParams.get('currency')?.toUpperCase();
    const status = searchParams.get('status') || 'active';

    let query = supabase
      .from('p2p_orders')
      .select(`
        *,
        creator:user_profiles(
          name,
          completed_trades,
          completion_rate
        )
      `)
      .eq('status', status)
      .neq('creator_id', user.id); // Don't show user's own orders

    if (type) {
      query = query.eq('type', type);
    }

    if (currency) {
      query = query.eq('currency', currency);
    }

    const { data: orders, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching P2P orders:', error);
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: orders
    });
  } catch (error) {
    console.error('Error in P2P orders endpoint:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 