import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createQuidaxServer } from '@/lib/quidax';

interface WithdrawalResponse {
  id: string;
  currency: string;
  amount: string;
  address: string;
  network?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface QuidaxResponse<T> {
  status: string;
  message?: string;
  data: T;
}

const quidaxService = createQuidaxServer(process.env.QUIDAX_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get withdrawal parameters from request body
    const params = await request.json();

    // Get user's Quidax ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.quidax_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only allow NGN withdrawals to bank accounts (fiat withdrawal)
    if (params.currency.toUpperCase() !== 'NGN') {
      return NextResponse.json({ error: 'Only NGN withdrawals to bank accounts are allowed. Please convert your crypto to NGN first.' }, { status: 400 });
    }

    // Integrate with Korapay API to send NGN to user's bank account
    const { amount, bank_code, account_number, email, name, narration } = params;
    const reference = `tbk-${Date.now()}-${Math.floor(Math.random()*100000)}`;
    const korapayRes = await fetch(`${process.env.KORAPAY_API_URL}/transactions/disburse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KORAPAY_SECRET_KEY}`
      },
      body: JSON.stringify({
        reference,
        destination: {
          type: 'bank_account',
          amount: Number(amount),
          currency: 'NGN',
          narration: narration || 'trustBank withdrawal',
          bank_account: {
            bank: bank_code,
            account: account_number
          },
          customer: {
            name: name || '',
            email
          }
        }
      })
    });
    const korapayData = await korapayRes.json();
    if (!korapayData.status) {
      return NextResponse.json({ error: korapayData.message || 'Korapay payout failed', details: korapayData }, { status: 502 });
    }

    // Debit NGN from user's fiat wallet (ngn_wallet)
    await supabase.rpc('debit_wallet', {
      user_id: user.id,
      wallet: 'ngn_wallet',
      amount: Number(amount)
    });

    // Record the withdrawal in the database as processing
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'withdrawal',
      amount: Number(amount),
      currency: 'NGN',
      status: 'processing',
      quidax_transaction_id: null, // Not a Quidax withdrawal
      korapay_reference: reference,
      metadata: { bank_code, account_number, korapay: korapayData }
    });

    return NextResponse.json({ status: 'success', message: 'Withdrawal initiated. Funds will be sent to your bank account.', korapay: korapayData });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
} 