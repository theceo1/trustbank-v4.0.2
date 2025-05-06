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

      // Fetch user's trading volume and fee tier from fees config endpoint
      const feesRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/config/fees`, {
        headers: { Cookie: request.headers.get('cookie') || '' }
      });
      const feesData = await feesRes.json();
      const tradeFeePercent = feesData?.data?.base_fees?.platform || 4.0; // fallback to 4%

      // Calculate fee and update wallets
      let feeAmount = 0;
      let netAmount = 0;
      let tradeCurrency = market.replace('ngn', '').replace('NGN', '').toUpperCase();
      let updates = [];
      if (side === 'buy') {
        // User buys BTC with NGN
        // Deduct NGN (including fee) from fiat wallet, credit BTC to crypto wallet
        // Assume order.executed_volume is the BTC bought, order.avg_price is NGN/BTC
        const btcAmount = Number(order.executed_volume || volume);
        const ngnAmount = Number(order.avg_price) * btcAmount;
        feeAmount = (tradeFeePercent / 100) * ngnAmount;
        netAmount = ngnAmount + feeAmount; // Total NGN to deduct
        updates.push(
          supabase.rpc('debit_wallet', {
            user_id: session.user.id,
            wallet: 'ngn_wallet',
            amount: netAmount
          }),
          supabase.rpc('credit_wallet', {
            user_id: session.user.id,
            wallet: `${tradeCurrency.toLowerCase()}_wallet`,
            amount: btcAmount
          })
        );
      } else if (side === 'sell') {
        // User sells BTC for NGN
        // Deduct BTC from crypto wallet, credit NGN (minus fee) to fiat wallet
        const btcAmount = Number(order.executed_volume || volume);
        const ngnAmount = Number(order.avg_price) * btcAmount;
        feeAmount = (tradeFeePercent / 100) * ngnAmount;
        netAmount = ngnAmount - feeAmount; // NGN to credit after fee
        updates.push(
          supabase.rpc('debit_wallet', {
            user_id: session.user.id,
            wallet: `${tradeCurrency.toLowerCase()}_wallet`,
            amount: btcAmount
          }),
          supabase.rpc('credit_wallet', {
            user_id: session.user.id,
            wallet: 'ngn_wallet',
            amount: netAmount
          })
        );
      }
      // Execute wallet updates
      await Promise.all(updates);
      // Log fee as a transaction
      await supabase.from('transactions').insert({
        user_id: session.user.id,
        type: 'trade_fee',
        amount: feeAmount,
        currency: 'NGN',
        status: 'completed',
        metadata: { market, side, order_id: order.id }
      });

      return NextResponse.json({
        status: 'success',
        data: order,
        fee: feeAmount,
        net_amount: netAmount,
        fee_percent: tradeFeePercent
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