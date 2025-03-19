import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { quidaxService } from '@/lib/quidax';

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
        creator:user_profiles(
          quidax_id,
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

    // Get trader's profile with Quidax ID
    const { data: traderProfile } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', session.user.id)
      .single();

    if (!traderProfile?.quidax_id) {
      return NextResponse.json(
        { status: 'error', message: 'Trading account not found' },
        { status: 404 }
      );
    }

    // For a sell order, buyer sends fiat to seller
    // For a buy order, seller sends crypto to buyer
    const isBuyOrder = order.type === 'buy';
    const buyerId = isBuyOrder ? order.creator_id : session.user.id;
    const sellerId = isBuyOrder ? session.user.id : order.creator_id;
    const buyerQuidaxId = isBuyOrder ? order.creator.quidax_id : traderProfile.quidax_id;
    const sellerQuidaxId = isBuyOrder ? traderProfile.quidax_id : order.creator.quidax_id;

    // For buy orders, verify seller's balance and lock funds
    if (isBuyOrder) {
      try {
        // Get seller's wallet balance
        const wallet = await quidaxService.getWallet(sellerQuidaxId, order.currency);
        const balance = parseFloat(wallet.data.balance);

        if (balance < cryptoAmount) {
          return NextResponse.json(
            { status: 'error', message: `Insufficient ${order.currency.toUpperCase()} balance` },
            { status: 400 }
          );
        }

        // Lock the funds by transferring to escrow wallet
        await quidaxService.transferToMainAccount(sellerQuidaxId, {
          currency: order.currency,
          amount: cryptoAmount.toString(),
          fund_uid: process.env.QUIDAX_ESCROW_WALLET_ID as string,
          transaction_note: `P2P buy order escrow`,
          narration: `P2P buy order escrow`
        });
      } catch (error: any) {
        console.error('Error checking/locking balance:', error);
        return NextResponse.json(
          { status: 'error', message: error.message || 'Failed to process order' },
          { status: 500 }
        );
      }
    }

    // Create the trade
    const { data: trade, error: tradeError } = await supabase
      .from('p2p_trades')
      .insert([
        {
          order_id: params.id,
          buyer_id: buyerId,
          seller_id: sellerId,
          trader_id: session.user.id,
          amount: amount.toString(),
          crypto_amount: cryptoAmount.toString(),
          status: 'pending',
          buyer_quidax_id: buyerQuidaxId,
          seller_quidax_id: sellerQuidaxId
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
        amount: (remainingAmount - cryptoAmount).toString(),
        updated_at: new Date().toISOString()
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