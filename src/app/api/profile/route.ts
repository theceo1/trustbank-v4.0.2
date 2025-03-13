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

    // Create Quidax user
    const quidaxResponse = await fetch(`${QUIDAX_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
      }),
    });

    const quidaxData = await quidaxResponse.json();
    
    if (!quidaxResponse.ok) {
      console.error('Quidax API error:', {
        status: quidaxResponse.status,
        statusText: quidaxResponse.statusText,
        data: quidaxData,
      });
      return NextResponse.json(
        { status: 'error', message: 'Failed to create Quidax user' },
        { status: quidaxResponse.status }
      );
    }

    // Create user profile with Quidax ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: user.id,
          quidax_id: quidaxData.data.id,
          kyc_verified: false,
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      status: 'success', 
      data: profile 
    });
  } catch (error) {
    console.error('Error in profile creation:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to create profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      status: 'success', 
      data: profile 
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
} 