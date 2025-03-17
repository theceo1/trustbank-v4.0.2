import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile and verification history
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('verification_history')
      .eq('user_id', session.user.id)
      .single();

    if (profileError) throw profileError;

    const verificationHistory = profile?.verification_history || {};
    const hasBasicKyc = verificationHistory.email && 
                       verificationHistory.phone && 
                       verificationHistory.basic_info;

    return NextResponse.json({
      status: 'success',
      data: {
        hasBasicKyc,
        verificationHistory
      }
    });

  } catch (error) {
    console.error('Error checking KYC status:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to check KYC status' },
      { status: 500 }
    );
  }
} 