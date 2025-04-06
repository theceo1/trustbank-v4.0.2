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

    // Create withdrawal using Quidax service
    const withdrawal = await quidaxService.request(`/users/${profile.quidax_id}/withdrawals`, {
      method: 'POST',
      data: {
        currency: params.currency,
        amount: params.amount,
        address: params.address,
        network: params.network
      }
    }) as QuidaxResponse<WithdrawalResponse>;

    // Record the withdrawal in the database
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'withdrawal',
      amount: params.amount,
      currency: params.currency,
      status: 'pending',
      quidax_transaction_id: withdrawal.data.id,
      metadata: withdrawal.data
    });

    return NextResponse.json({ data: withdrawal.data });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
} 