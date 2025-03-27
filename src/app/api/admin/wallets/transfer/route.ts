import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const quidaxApiKey = process.env.QUIDAX_API_KEY;
    const quidaxBaseUrl = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const { currency, amount, address, network } = await request.json();

    // Validate inputs
    if (!currency || !amount || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initiate withdrawal on Quidax
    const response = await fetch(`${quidaxBaseUrl}/users/me/withdraws`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${quidaxApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency: currency.toLowerCase(),
        amount: amount.toString(),
        fund_uid: address,
        network: network || undefined,
        transaction_note: 'Admin transfer',
        narration: 'System wallet transfer',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Transfer failed');
    }

    const data = await response.json();

    // Log the transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'withdrawal',
      status: 'pending',
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      metadata: {
        quidax_id: data.data.id,
        address,
        network,
      },
    });

    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    );
  }
}