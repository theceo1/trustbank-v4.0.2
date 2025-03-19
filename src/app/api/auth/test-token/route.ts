import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { quidaxService } from '@/lib/quidax';

export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    }, {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Create a test user
    const email = `test${Date.now()}@example.com`;
    const password = 'testpassword123';

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      return NextResponse.json(
        { status: 'error', message: `Sign up failed: ${signUpError.message}` },
        { status: 500 }
      );
    }

    // Sign in to get the session
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      return NextResponse.json(
        { status: 'error', message: `Sign in failed: ${signInError.message}` },
        { status: 500 }
      );
    }

    try {
      // Create Quidax sub-account
      console.log('Creating Quidax sub-account...');
      const quidaxResponse = await quidaxService.createSubAccount(
        email,
        'Test',
        'User'
      );

      if (!quidaxResponse?.data?.sn) {
        console.error('Quidax response:', quidaxResponse);
        throw new Error('No Quidax ID returned');
      }

      console.log('Quidax sub-account created:', quidaxResponse.data.sn);

      // Create user profile with the generated Quidax ID
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user?.id,
          email,
          name: 'Test User',
          kyc_status: 'verified',
          kyc_level: 2,
          completed_trades: 0,
          completion_rate: 100,
          quidax_id: quidaxResponse.data.sn,
          verification_history: {
            email: true,
            phone: true,
            basic_info: true
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      return NextResponse.json({
        status: 'success',
        data: {
          access_token: session?.access_token,
          user: {
            id: user?.id,
            email,
            quidax_id: quidaxResponse.data.sn
          }
        }
      });
    } catch (error: any) {
      console.error('Quidax/Profile error:', error);
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Failed to setup trading account: ${error.message}`,
          details: error.response?.data || error
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Test token error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: `Failed to create test token: ${error.message}`,
        details: error.response?.data || error
      },
      { status: 500 }
    );
  }
} 