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
    const { fromCurrency, toCurrency, amount } = await request.json();

    // Validate inputs
    if (!fromCurrency || !toCurrency || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create swap quotation
    const quotationResponse = await fetch(`${quidaxBaseUrl}/users/me/swap_quotation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${quidaxApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_currency: fromCurrency.toLowerCase(),
        to_currency: toCurrency.toLowerCase(),
        from_amount: amount.toString(),
      }),
    });

    if (!quotationResponse.ok) {
      const errorData = await quotationResponse.json();
      throw new Error(errorData.message || 'Failed to get swap quotation');
    }

    const quotationData = await quotationResponse.json();
    const quotationId = quotationData.data.id;

    // Confirm the swap
    const confirmResponse = await fetch(
      `${quidaxBaseUrl}/users/me/swap_quotation/${quotationId}/confirm`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${quidaxApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!confirmResponse.ok) {
      const errorData = await confirmResponse.json();
      throw new Error(errorData.message || 'Failed to confirm swap');
    }

    const confirmData = await confirmResponse.json();

    // Log the transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'swap',
      status: 'pending',
      amount: parseFloat(amount),
      currency: fromCurrency.toUpperCase(),
      metadata: {
        quidax_id: confirmData.data.id,
        from_currency: fromCurrency.toUpperCase(),
        to_currency: toCurrency.toUpperCase(),
        to_amount: confirmData.data.received_amount,
        execution_price: confirmData.data.execution_price,
      },
    });

    return NextResponse.json(confirmData.data);
  } catch (error) {
    console.error('Swap error:', error);
    return NextResponse.json(
      { error: 'Failed to process swap' },
      { status: 500 }
    );
  }
}