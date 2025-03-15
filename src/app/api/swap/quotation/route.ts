import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const QUIDAX_API_URL = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { from_currency, to_currency, from_amount } = body;

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

    // Create swap quotation
    const response = await fetch(`${QUIDAX_API_URL}/users/${profile.quidax_id}/swap_quotation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_currency: from_currency.toLowerCase(),
        to_currency: to_currency.toLowerCase(),
        from_amount
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to create swap quotation' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ status: 'success', data: data.data });
  } catch (error) {
    console.error('Error creating swap quotation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create swap quotation' },
      { status: 500 }
    );
  }
} 