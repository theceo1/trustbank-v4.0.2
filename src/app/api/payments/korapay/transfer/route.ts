import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { korapayService } from '@/lib/services/korapay';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, currency, bankCode, accountNumber, accountName, narration } = body;

    if (!amount || !currency || !bankCode || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initiate transfer with Korapay
    const transferResponse = await korapayService.initiateTransfer({
      amount,
      currency,
      bankCode,
      accountNumber,
      accountName,
      narration,
      userId: session.user.id,
    });

    return NextResponse.json({
      status: 'success',
      message: 'Transfer initiated successfully',
      data: transferResponse.data,
    });
  } catch (error: any) {
    console.error('Transfer error:', error);
    // Try to surface the real error message
    if (error && typeof error === 'object') {
      if ('message' in error) {
        console.error('Error message:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if ('error' in error) {
        console.error('Error object:', error.error);
        return NextResponse.json({ error: error.error }, { status: 500 });
      }
    }
    if (error instanceof Response) {
      try {
        const errData = await error.json();
        console.error('Response error:', errData);
        return NextResponse.json({ error: errData.message || errData.error || 'Failed to process transfer' }, { status: 500 });
      } catch (e) {
        console.error('Failed to parse error response:', e);
        return NextResponse.json({ error: 'Failed to process transfer' }, { status: 500 });
      }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process transfer' },
      { status: 500 }
    );
  }
} 