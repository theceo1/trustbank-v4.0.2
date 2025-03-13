import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const QUIDAX_API_URL = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!QUIDAX_SECRET_KEY) {
      console.error('QUIDAX_SECRET_KEY is not defined');
      return NextResponse.json(
        { status: 'error', message: 'API configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { from_currency, to_currency, from_amount, user_id } = body;

    if (!from_currency || !to_currency || !from_amount || !user_id) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get user's Quidax ID from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.quidax_id) {
      return NextResponse.json(
        { status: 'error', message: 'Failed to get Quidax ID' },
        { status: 400 }
      );
    }

    // Ensure the user_id matches the profile's quidax_id
    if (user_id !== profile.quidax_id) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    console.log('Making request to Quidax API:', {
      url: `${QUIDAX_API_URL}/users/${user_id}/swap_quotation`,
      body: {
        from_currency,
        to_currency,
        from_amount,
      }
    });

    const response = await fetch(`${QUIDAX_API_URL}/users/${user_id}/swap_quotation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        from_currency,
        to_currency,
        from_amount,
      }),
    });

    const data = await response.json();
    console.log('Quidax API response:', data);

    if (!response.ok) {
      console.error('Quidax API error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });

      // Handle specific error codes
      if (data.data?.code === 'E0612') {
        return NextResponse.json(
          { 
            status: 'error', 
            message: 'Invalid swap parameters. Please check your amount and try again.',
            data: data.data
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { 
          status: 'error', 
          message: data.message || `Failed to get quote from Quidax API`,
          data: data.data
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ status: 'success', data: data.data });
  } catch (error) {
    console.error('Error getting swap quote:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to get swap quote',
        data: null
      },
      { status: 500 }
    );
  }
} 