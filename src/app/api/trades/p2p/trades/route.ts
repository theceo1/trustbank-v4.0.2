import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { QuidaxService } from '@/lib/quidax';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(authHeader.split(' ')[1]);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { order_id, amount } = body;

    if (!order_id || !amount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('p2p_orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate order status
    if (order.status !== 'active') {
      return NextResponse.json({ error: 'Order is not active' }, { status: 400 });
    }

    // Validate amount
    if (amount < order.min_order || amount > order.max_order) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get user's Quidax ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('quidax_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.quidax_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get seller's Quidax ID
    const { data: sellerProfile, error: sellerError } = await supabase
      .from('profiles')
      .select('quidax_id')
      .eq('id', order.creator_id)
      .single();

    if (sellerError || !sellerProfile?.quidax_id) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Create escrow wallet using server-side service
    const quidax = new QuidaxService(process.env.QUIDAX_API_URL, process.env.QUIDAX_SECRET_KEY);
    
    // Lock funds in escrow
    const escrowResponse = await quidax.transferToMainAccount(profile.quidax_id, {
      currency: order.currency,
      amount: amount.toString(),
      fund_uid: process.env.QUIDAX_ESCROW_WALLET_ID!,
      transaction_note: `P2P trade escrow for order ${order_id}`,
      narration: 'P2P trade escrow'
    });

    if (!escrowResponse.success) {
      return NextResponse.json({ error: 'Failed to lock funds in escrow' }, { status: 500 });
    }

    const total = amount * order.price;
    const paymentWindow = 30; // 30 minutes payment window

    // Generate unique escrow confirmation code
    const escrowCode = `ESC${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Start transaction
    const { data: escrow, error: escrowError } = await supabase
      .from('p2p_escrows')
      .insert({
        order_id,
        buyer_id: user.id,
        seller_id: order.creator_id,
        amount,
        price: order.price,
        total,
        escrow_wallet_id: process.env.QUIDAX_ESCROW_WALLET_ID,
        escrow_confirmation_code: escrowCode,
        payment_window_minutes: paymentWindow,
        expires_at: new Date(Date.now() + paymentWindow * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (escrowError) {
      return NextResponse.json({ error: 'Failed to create escrow' }, { status: 500 });
    }

    // Create trade record
    const { data: trade, error: tradeError } = await supabase
      .from('p2p_trades')
      .insert({
        escrow_id: escrow.id,
        order_id,
        buyer_id: user.id,
        seller_id: order.creator_id,
        amount,
        price: order.price,
        total,
        buyer_quidax_id: profile.quidax_id,
        seller_quidax_id: sellerProfile.quidax_id
      })
      .select()
      .single();

    if (tradeError) {
      return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        trade,
        escrow,
        payment_methods: order.payment_methods,
        terms: order.terms
      }
    });

  } catch (error) {
    console.error('P2P trade error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 