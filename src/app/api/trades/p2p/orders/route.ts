import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';
import { quidaxService } from '@/lib/quidax';

export async function POST(request: Request) {
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

    const json = await request.json();
    const {
      type,
      currency,
      amount,
      price,
      min_order,
      max_order,
      payment_methods,
      terms
    } = json;

    // Validate required fields
    if (!type || !currency || !amount || !price || !min_order || !max_order || !payment_methods) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate order type
    if (!['buy', 'sell'].includes(type)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid order type' },
        { status: 400 }
      );
    }

    // Validate amounts
    if (parseFloat(min_order) <= 0 || parseFloat(max_order) <= 0 || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid amounts' },
        { status: 400 }
      );
    }

    if (parseFloat(min_order) > parseFloat(max_order)) {
      return NextResponse.json(
        { status: 'error', message: 'Minimum order cannot be greater than maximum order' },
        { status: 400 }
      );
    }

    if (parseFloat(max_order) > parseFloat(amount)) {
      return NextResponse.json(
        { status: 'error', message: 'Maximum order cannot be greater than total amount' },
        { status: 400 }
      );
    }

    // Get user's profile with quidax_id
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*, quidax_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('User profile not found:', profileError);
      return NextResponse.json(
        { status: 'error', message: 'User profile not found. Please complete registration first.' },
        { status: 404 }
      );
    }

    if (!profile.quidax_id) {
      return NextResponse.json(
        { status: 'error', message: 'Trading account not found. Please complete registration first.' },
        { status: 404 }
      );
    }

    // For sell orders, verify balance and lock funds
    if (type === 'sell') {
      try {
        // Get user's wallet balance
        const wallet = await quidaxService.getWallet(profile.quidax_id, currency.toLowerCase());
        const balance = parseFloat(wallet.data.balance);
        const amountToLock = parseFloat(amount);

        if (balance < amountToLock) {
          return NextResponse.json(
            { status: 'error', message: `Insufficient ${currency.toUpperCase()} balance` },
            { status: 400 }
          );
        }

        // Lock the funds by transferring to escrow wallet
        await quidaxService.transferToMainAccount(profile.quidax_id, {
          currency: currency.toLowerCase(),
          amount: amount.toString(),
          fund_uid: process.env.QUIDAX_ESCROW_WALLET_ID as string,
          transaction_note: `P2P sell order escrow`,
          narration: `P2P sell order escrow`
        });
      } catch (error: any) {
        console.error('Error checking/locking balance:', error);
        return NextResponse.json(
          { status: 'error', message: error.message || 'Failed to process order' },
          { status: 500 }
        );
      }
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('p2p_orders')
      .insert({
        creator_id: user.id, // Use user.id instead of quidax_id
        type,
        currency: currency.toLowerCase(),
        amount,
        price,
        min_order,
        max_order,
        payment_methods,
        terms,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        creator:user_profiles(
          name,
          completed_trades,
          completion_rate,
          quidax_id
        )
      `)
      .single();

    if (orderError || !order) {
      console.error('Error creating P2P order:', orderError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to create order' },
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
      { status: 'error', message: 'Internal server error' },
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