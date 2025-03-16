import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
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
      .from('users')
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
    console.error('Error in direct KYC status endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 