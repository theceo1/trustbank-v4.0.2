import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

    // Get the request body
    const body = await request.json();
    
    // Update user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .update({
        full_name: body.full_name,
        phone_number: body.phone_number,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        postal_code: body.postal_code,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: profile
    });
  } catch (error: any) {
    console.error('Error in profile route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
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