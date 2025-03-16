import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile and verification status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        kyc_tier,
        risk_score,
        verification_history,
        last_verification_at,
        failed_verification_attempts
      `)
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch KYC status' },
        { status: 500 }
      );
    }

    // Get pending verification requests
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
    }

    return NextResponse.json({
      status: 'success',
      data: {
        profile,
        pending_requests: pendingRequests || []
      }
    });
  } catch (error) {
    console.error('Error in KYC status endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 