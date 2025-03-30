import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const QUIDAX_API_URL = process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { quotation_id } = await request.json();

    if (!quotation_id) {
      return NextResponse.json(
        { error: 'Missing quotation ID' },
        { status: 400 }
      );
    }

    // Get user's Quidax ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', session.user.id)
      .single();

    if (!profile?.quidax_id) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Confirm swap with Quidax
    const response = await fetch(`${QUIDAX_API_URL}/users/${profile.quidax_id}/swap_quotation/${quotation_id}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to confirm swap' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Store the swap transaction in our database
    const { error: dbError } = await supabase
      .from('swap_transactions')
      .insert({
        user_id: session.user.id,
        quidax_swap_id: data.data.id,
        from_currency: data.data.from_currency,
        to_currency: data.data.to_currency,
        from_amount: data.data.from_amount,
        to_amount: data.data.received_amount,
        rate: data.data.execution_price,
        status: data.data.status
      });

    if (dbError) {
      console.error('Error storing swap transaction:', dbError);
      // Don't return error since the swap was successful
    }

    return NextResponse.json(data.data);

  } catch (error) {
    console.error('Error in swap confirmation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 