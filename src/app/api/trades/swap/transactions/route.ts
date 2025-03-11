import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { quidaxService } from '@/lib/quidax';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's Quidax ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.quidax_id) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Fetch swap transactions from Quidax
    const transactions = await quidaxService.getSwapTransactions(profile.quidax_id);

    return NextResponse.json({
      status: 'success',
      data: transactions.map((tx: any) => ({
        id: tx.id,
        from_currency: tx.from_currency,
        to_currency: tx.to_currency,
        from_amount: tx.from_amount,
        to_amount: tx.received_amount,
        rate: tx.execution_price,
        status: tx.status,
        created_at: tx.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching swap transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch swap transactions' },
      { status: 500 }
    );
  }
} 