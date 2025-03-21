import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const QUIDAX_API_URL = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

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
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { quotation_id } = body;

    // Validate required parameters
    if (!quotation_id) {
      return NextResponse.json(
        { error: 'Missing quotation ID' },
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

    // Get the pending swap transaction
    const { data: pendingSwap } = await supabase
      .from('swap_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('quidax_quotation_id', quotation_id)
      .eq('status', 'pending')
      .single();

    if (!pendingSwap) {
      return NextResponse.json(
        { error: 'Swap quotation not found or expired' },
        { status: 404 }
      );
    }

    // Confirm swap with Quidax
    const confirmResponse = await fetch(
      `${QUIDAX_API_URL}/users/${profile.quidax_id}/swap_quotation/${quotation_id}/confirm`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!confirmResponse.ok) {
      console.error('Failed to confirm swap with Quidax:', await confirmResponse.text());
      return NextResponse.json(
        { error: 'Failed to confirm swap' },
        { status: 500 }
      );
    }

    const confirmData = await confirmResponse.json();

    // Update the swap transaction
    const { error: updateError } = await supabase
      .from('swap_transactions')
      .update({
        status: confirmData.data.status,
        quidax_swap_id: confirmData.data.id,
        to_amount: confirmData.data.received_amount,
        execution_price: confirmData.data.execution_price,
        updated_at: new Date().toISOString()
      })
      .eq('quidax_quotation_id', quotation_id);

    if (updateError) {
      console.error('Failed to update swap transaction:', updateError);
      return NextResponse.json(
        { error: 'Failed to update swap record' },
        { status: 500 }
      );
    }

    // Update wallet balances
    const fromAmount = parseFloat(confirmData.data.from_amount);
    const toAmount = parseFloat(confirmData.data.received_amount);
    const fromCurrency = confirmData.data.from_currency.toLowerCase();
    const toCurrency = confirmData.data.to_currency.toLowerCase();

    // Get current wallet balances
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .in('currency', [fromCurrency, toCurrency]);

    if (walletsError) {
      console.error('Failed to fetch wallets:', walletsError);
      return NextResponse.json(
        { error: 'Failed to update wallet balances' },
        { status: 500 }
      );
    }

    // Update source wallet (deduct from_amount)
    const fromWallet = wallets.find(w => w.currency === fromCurrency);
    if (fromWallet) {
      console.log(`Updating ${fromCurrency} wallet: Current balance=${fromWallet.balance}, Deducting ${fromAmount}`);
      const { error: fromUpdateError } = await supabase
        .from('wallets')
        .update({
          balance: Math.max(0, parseFloat(fromWallet.balance) - fromAmount),
          updated_at: new Date().toISOString()
        })
        .eq('id', fromWallet.id);

      if (fromUpdateError) {
        console.error('Failed to update source wallet:', fromUpdateError);
        return NextResponse.json(
          { error: 'Failed to update source wallet balance' },
          { status: 500 }
        );
      }
    }

    // Update destination wallet (add to_amount)
    const toWallet = wallets.find(w => w.currency === toCurrency);
    if (toWallet) {
      console.log(`Updating ${toCurrency} wallet: Current balance=${toWallet.balance}, Adding ${toAmount}`);
      const { error: toUpdateError } = await supabase
        .from('wallets')
        .update({
          balance: parseFloat(toWallet.balance) + toAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', toWallet.id);

      if (toUpdateError) {
        console.error('Failed to update destination wallet:', toUpdateError);
        return NextResponse.json(
          { error: 'Failed to update destination wallet balance' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      status: 'success',
      data: {
        id: confirmData.data.id,
        from_currency: confirmData.data.from_currency,
        to_currency: confirmData.data.to_currency,
        from_amount: confirmData.data.from_amount,
        received_amount: confirmData.data.received_amount,
        execution_price: confirmData.data.execution_price,
        status: confirmData.data.status,
        created_at: confirmData.data.created_at,
        updated_at: confirmData.data.updated_at
      }
    });
  } catch (error) {
    console.error('Error in swap confirmation endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 