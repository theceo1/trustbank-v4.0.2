// src/app/api/auth/signup/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { QuidaxServerService } from '@/lib/quidax';

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
      const { data: referrer, error: referrerError } = await supabase
        .from('user_profiles')
        .select('referral_code')
        .eq('referral_code', referralCode)
        .single();

      if (referrerError || !referrer) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        );
      }
    }

    // Create Quidax sub-account first
    let quidaxId;
    try {
      const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;
      if (!quidaxSecretKey) {
        console.error('Missing QUIDAX_SECRET_KEY environment variable');
        throw new Error('QUIDAX_SECRET_KEY is not configured');
      }

      console.log('[Signup] Creating Quidax sub-account for:', { email, firstName, lastName });
      const quidaxService = new QuidaxServerService(quidaxSecretKey);
      
      // Add retry logic for Quidax account creation
      const maxRetries = 3;
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Signup] Attempt ${attempt} to create Quidax account`);
          
          const quidaxResponse = await quidaxService.createSubAccount(
            email,
            firstName,
            lastName || ''
          );

          console.log('[Signup] Quidax response:', JSON.stringify(quidaxResponse, null, 2));

          if (!quidaxResponse?.data?.id) {
            console.error('[Signup] Invalid Quidax response:', quidaxResponse);
            throw new Error('No Quidax ID returned');
          }

          quidaxId = quidaxResponse.data.id;
          console.log('[Signup] Quidax sub-account created:', quidaxId);
          break; // Success, exit retry loop
          
        } catch (quidaxApiError: any) {
          lastError = quidaxApiError;
          
          // Check for specific API errors that shouldn't be retried
          const errorMessage = quidaxApiError.response?.data?.message || 
                             quidaxApiError.response?.data?.error || 
                             quidaxApiError.message;
          
          // Don't retry if email is already taken
          if (errorMessage?.toLowerCase().includes('email') && 
              errorMessage?.toLowerCase().includes('taken')) {
            return NextResponse.json(
              { 
                error: 'Email address is already registered',
                code: 'EMAIL_TAKEN'
              },
              { status: 400 }
            );
          }

          // Log the error for debugging
          console.error(`[Signup] Quidax API error (attempt ${attempt}):`, {
            error: quidaxApiError,
            response: quidaxApiError.response?.data,
            message: errorMessage
          });

          // If this was the last attempt, throw the error
          if (attempt === maxRetries) {
            throw new Error(`Failed to create Quidax account after ${maxRetries} attempts: ${errorMessage}`);
          }

          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }

      // If we got here without a quidaxId, throw the last error
      if (!quidaxId && lastError) {
        throw lastError;
      }

    } catch (quidaxError: any) {
      console.error('[Signup] Error in Quidax account creation:', {
        error: quidaxError.message,
        response: quidaxError.response?.data,
        status: quidaxError.response?.status
      });

      return NextResponse.json(
        { 
          error: 'Failed to create Quidax account',
          details: quidaxError.message,
          code: 'QUIDAX_ACCOUNT_CREATION_FAILED'
        },
        { status: 500 }
      );
    }

    // Sign up the user in Supabase with retry logic
    let signUpData: { user: any } | null = null;
    try {
      const maxRetries = 3;
      let lastError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Signup] Attempt ${attempt} to create Supabase account`);
          
          const { data, error } = await supabase.auth.signUp({
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

          if (error) throw error;
          if (!data || !data.user) throw new Error('No user data returned from signup');
          
          signUpData = data;
          break; // Success, exit retry loop

        } catch (error) {
          lastError = error;
          console.error(`[Signup] Supabase signup error (attempt ${attempt}):`, error);

          if (attempt === maxRetries) {
            throw error;
          }

          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }

      if (!signUpData || !signUpData.user) {
        throw lastError || new Error('Failed to create user account');
      }

    } catch (signUpError: any) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    // Generate a unique referral code
    const newReferralCode = nanoid(8);

    // Update the user profile with all fields in a single update
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        first_name: firstName,
        last_name: lastName || '',
        full_name: `${firstName} ${lastName || ''}`.trim(),
        email: email,
        referral_code: newReferralCode,
        referred_by: referralCode || null,
        quidax_id: quidaxId,
        quidax_sn: quidaxId,
        role: 'user',
        kyc_level: 'basic',
        kyc_verified: false,
        two_factor_enabled: false,
        total_referrals: 0,
        active_referrals: 0,
        referral_earnings: 0,
        pending_earnings: 0,
        completed_trades: 0,
        completion_rate: 100,
        trading_volume_usd: 0,
        monthly_volume_usd: 0,
        daily_volume_usd: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        verification_history: {
          email: true,
          phone: false,
          basic_info: false
        }
      })
      .eq('user_id', signUpData.user!.id);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update user profile', details: profileError.message },
        { status: 500 }
      );
    }

    // Verify the profile was updated with Quidax ID
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', signUpData.user!.id)
      .single();

    if (verifyError || !verifyProfile?.quidax_id) {
      console.error('Profile verification failed:', {
        error: verifyError,
        profile: verifyProfile,
        userId: signUpData.user!.id
      });
      return NextResponse.json(
        { error: 'Failed to verify profile update' },
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