import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user (admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get target user's email from query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Get target user's ID
    const { data: targetUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
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
      .eq('user_id', targetUser.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch KYC status' },
        { status: 500 }
      );
    }

    // Get verification requests history
    const { data: verificationRequests, error: requestsError } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', targetUser.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
    }

    // Get risk factors
    const { data: riskFactors, error: riskError } = await supabase
      .from('risk_factors')
      .select('*')
      .eq('user_id', targetUser.id)
      .order('created_at', { ascending: false });

    if (riskError) {
      console.error('Error fetching risk factors:', riskError);
    }

    return NextResponse.json({
      status: 'success',
      data: {
        profile,
        verification_requests: verificationRequests || [],
        risk_factors: riskFactors || []
      }
    });
  } catch (error) {
    console.error('Error in admin KYC status endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 