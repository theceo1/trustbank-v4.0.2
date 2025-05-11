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
  const receivedAt = new Date().toISOString();
  console.log('[Swap Confirm] Incoming request at:', receivedAt);
  console.log('[Swap Confirm] Request headers:', Object.fromEntries(request.headers.entries()));
  console.log('[Swap Confirm] Request method:', request.method);
  try {
    // Log cookies
    try {
      const cookieHeader = request.headers.get('cookie');
      console.log('[Swap Confirm] Cookie header:', cookieHeader);
    } catch (e) {
      console.log('[Swap Confirm] Could not log cookie header:', e);
    }
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[Swap Confirm] Supabase user:', { user, authError });
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
    console.log('[Swap Confirm] User profile:', { profile });
    if (!profile?.quidax_id) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Log the confirmation attempt
    const confirmAttemptAt = new Date().toISOString();
    console.log('[Swap Confirm] Attempting to confirm swap quotation', {
      appUserId: user.id,
      quidaxId: profile.quidax_id,
      quotationId: params.id,
      confirmAttemptAt
    });

    let swapTransaction;
    const quidaxCallStart = new Date().toISOString();
    try {
      swapTransaction = await quidaxService.confirmSwapQuotation(profile.quidax_id, params.id);
      const quidaxCallEnd = new Date().toISOString();
      console.log('[Swap Confirm] Quidax API response:', {
        quidaxId: profile.quidax_id,
        quotationId: params.id,
        swapTransaction,
        quidaxCallStart,
        quidaxCallEnd
      });
    } catch (quidaxError: unknown) {
      // Type guard for error logging
      let errorLog: any = quidaxError;
      let responseData = undefined;
      let message = undefined;
      if (typeof errorLog === 'object' && errorLog !== null) {
        if ('response' in errorLog && typeof errorLog.response === 'object' && errorLog.response !== null && 'data' in errorLog.response) {
          responseData = (errorLog.response as any).data;
        }
        if ('message' in errorLog) {
          message = (errorLog as any).message;
        }
      }
      console.error('[Swap Confirm] Quidax API error:', {
        quidaxId: profile.quidax_id,
        quotationId: params.id,
        error: responseData || message || quidaxError
      });
      throw quidaxError;
    }

    // Log the full swapTransaction for debugging
    console.log('[Swap Confirm] Full swapTransaction object:', swapTransaction);

    // Store the transaction in our database
    const { error: swapError } = await supabase
      .from('swap_transactions')
      .insert({
        user_id: user.id,
        from_currency: swapTransaction.from_currency,
        to_currency: swapTransaction.to_currency,
        from_amount: parseFloat(swapTransaction.from_amount),
        to_amount: parseFloat(swapTransaction.received_amount),
        execution_price: null, // Not present in SwapTransaction, fallback to null
        status: swapTransaction.status,
        quidax_swap_id: swapTransaction.id,
        quidax_quotation_id: params.id
      });

    if (swapError) {
      console.error('Error storing swap:', swapError);
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