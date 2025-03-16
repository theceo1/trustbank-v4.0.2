import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { quidaxService } from '@/lib/quidax';

const QUIDAX_API_URL = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!QUIDAX_SECRET_KEY) {
      console.error('QUIDAX_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
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
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Confirm swap quotation
    const swapTransaction = await quidaxService.confirmSwapQuotation(profile.quidax_id, params.id);

    // Store the transaction in our database
    const { error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        type: 'swap',
        market: `${swapTransaction.from_currency}${swapTransaction.to_currency}`,
        amount: parseFloat(swapTransaction.from_amount),
        price: parseFloat(swapTransaction.execution_price),
        fee: 0, // We'll update this once we have fee calculation
        from_currency: swapTransaction.from_currency,
        to_currency: swapTransaction.to_currency,
        from_amount: parseFloat(swapTransaction.from_amount),
        to_amount: parseFloat(swapTransaction.received_amount),
        status: swapTransaction.status
      });

    if (tradeError) {
      console.error('Error storing trade:', tradeError);
      // Don't return error since the swap was successful
    }

    return NextResponse.json({
      status: 'success',
      data: swapTransaction
    });
  } catch (error) {
    console.error('Error confirming swap:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to confirm swap' },
      { status: 500 }
    );
  }
} 