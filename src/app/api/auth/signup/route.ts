// src/app/api/auth/signup/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { QuidaxService } from '@/lib/quidax';

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, referralCode } = await request.json();

    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: 'Email, password and first name are required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // If referral code provided, verify it exists
    if (referralCode) {
      console.log('[Signup] Verifying referral code:', referralCode);
      const { data: referrer, error: referrerError } = await supabase
        .from('user_profiles')
        .select('referral_code')
        .eq('referral_code', referralCode)
        .single();

      if (referrerError || !referrer) {
        console.error('[Signup] Invalid referral code:', referralCode);
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        );
      }
      console.log('[Signup] Referral code verified:', referralCode);
    }

    // First, sign up the user in Supabase
    console.log('[Signup] Creating Supabase account');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName || '',
          full_name: `${firstName} ${lastName || ''}`.trim()
        }
      }
    });

    if (signUpError) {
      console.error('[Signup] Error creating Supabase account:', signUpError);
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!signUpData.user) {
      console.error('[Signup] No user data returned from signup');
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    console.log('[Signup] Supabase account created:', signUpData.user.id);
    console.log('[Signup] Full signup data:', JSON.stringify(signUpData, null, 2));

    // Create Quidax sub-account first
    let quidaxId;
    try {
      const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;
      if (!quidaxSecretKey) {
        console.error('Missing QUIDAX_SECRET_KEY environment variable');
        throw new Error('QUIDAX_SECRET_KEY is not configured');
      }

      console.log('[Signup] Creating Quidax sub-account for:', { email, firstName, lastName });
      const quidaxService = new QuidaxService(quidaxSecretKey);
      
      const quidaxResponse = await quidaxService.createSubAccount({
        email,
        first_name: firstName,
        last_name: lastName || ''
      });

      console.log('[Signup] Quidax response:', JSON.stringify(quidaxResponse, null, 2));

      if (!quidaxResponse.id) {
        console.error('[Signup] Invalid Quidax response:', quidaxResponse);
        throw new Error('Failed to complete account setup');
      }

      quidaxId = quidaxResponse.id;
      console.log('[Signup] Account created:', quidaxId);

    } catch (quidaxError: any) {
      console.error('[Signup] Error in Quidax account creation:', {
        error: quidaxError.message,
        response: quidaxError.response?.data,
        status: quidaxError.response?.status
      });

      return NextResponse.json(
        { 
          error: 'Failed to complete account setup',
          code: 'ACCOUNT_SETUP_FAILED'
        },
        { status: 500 }
      );
    }

    // Generate a unique referral code
    const newReferralCode = nanoid(8);

    // Update the user profile with Quidax ID and referral code
    console.log('[Signup] Updating user profile with Quidax ID and referral code');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        quidax_id: quidaxId,
        quidax_sn: quidaxId,
        referral_code: newReferralCode,
        referred_by: referralCode || null,
        verification_history: {
          email: true,
          phone: false,
          basic_info: false
        }
      })
      .eq('user_id', signUpData.user.id);

    if (profileError) {
      console.error('[Signup] Error updating user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update user profile', details: profileError.message },
        { status: 500 }
      );
    }

    // Sign in the user immediately after successful signup
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.error('[Signup] Error signing in after signup:', signInError);
      return NextResponse.json(
        { error: 'Failed to sign in after signup' },
        { status: 500 }
      );
    }

    // Set the session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: signInData.user,
        session: signInData.session,
        quidax_id: quidaxId
      }
    });

    // Ensure auth cookie is set
    if (signInData.session) {
      const sessionStr = JSON.stringify(signInData.session);
      response.cookies.set('sb-auth-token', sessionStr, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
    }

    return response;

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
} 