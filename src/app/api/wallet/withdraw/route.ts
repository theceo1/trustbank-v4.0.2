import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { QuidaxService } from '@/lib/quidax';

const quidaxService = new QuidaxService(
  process.env.NEXT_PUBLIC_QUIDAX_API_URL,
  process.env.QUIDAX_SECRET_KEY
);

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

    // Create withdrawal using Quidax service
    const withdrawal = await quidaxService.createWithdrawal(user.id, {
      currency: params.currency,
      amount: params.amount,
      address: params.address,
    });

    // Record the withdrawal in the database
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'withdrawal',
      amount: params.amount,
      currency: params.currency,
      status: 'pending',
      quidax_transaction_id: withdrawal.id,
    });

    return NextResponse.json({ data: withdrawal });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
} 