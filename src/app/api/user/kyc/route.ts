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
    return NextResponse.json(
      { status: 'error', message: 'Failed to check KYC status' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = cookies();
    console.log('Initializing Supabase client...');
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('Parsing request body...');
    const { userId } = await request.json();

    if (!userId) {
      console.log('No userId provided in request');
      return NextResponse.json({ status: 'error', message: 'User ID is required' }, { status: 400 });
    }

    console.log('Checking for existing profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.log('Profile not found, creating new profile for user:', userId);
      console.log('Profile error:', profileError);
      
      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          verification_history: {
            email: true,
            phone: true,
            basic_info: true
          }
        })
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
      console.log('Insert successful:', insertData);
    } else {
      console.log('Updating existing profile for user:', userId);
      const { data: updateData, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          verification_history: {
            email: true,
            phone: true,
            basic_info: true
          }
        })
        .eq('user_id', userId)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }
      console.log('Update successful:', updateData);
    }

    console.log('Setting KYC cookie...');
    const response = NextResponse.json({ status: 'success', message: 'KYC status updated' });
    response.cookies.set('x-kyc-status', 'verified', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Error in KYC update:', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { status: 'error', message: 'Failed to update KYC status', details: errorMessage },
      { status: 500 }
    );
  }
} 