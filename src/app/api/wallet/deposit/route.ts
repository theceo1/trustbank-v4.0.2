import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { amount, name, email } = await request.json();
    if (!amount || !name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique reference for this deposit
    const reference = `tbk-deposit-${Date.now()}-${Math.floor(Math.random()*100000)}`;

    // Call KoraPay API to create a virtual account for deposit
    const korapayRes = await fetch(`${process.env.KORAPAY_API_URL}/charges/bank-transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KORAPAY_SECRET_KEY}`
      },
      body: JSON.stringify({
        account_name: name,
        amount: Number(amount),
        currency: 'NGN',
        reference,
        customer: {
          name,
          email
        }
      })
    });
    const korapayData = await korapayRes.json();
    if (!korapayData.status) {
      return NextResponse.json({ error: korapayData.message || 'Korapay deposit failed', details: korapayData }, { status: 502 });
    }

    // Log the deposit initiation in transactions table (pending)
    await supabase.from('transactions').insert({
      type: 'deposit',
      amount: Number(amount),
      currency: 'NGN',
      status: 'pending',
      reference,
      user_email: email,
      metadata: { korapay: korapayData, provider: 'korapay' }
    });

    // Return virtual account details to frontend for user to transfer funds
    return NextResponse.json({ status: 'success', data: korapayData.data, reference });
  } catch (error: any) {
    console.error('Deposit error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
