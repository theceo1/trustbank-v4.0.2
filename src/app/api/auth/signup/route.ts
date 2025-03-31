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
        throw new Error('QUIDAX_SECRET_KEY is not configured');
      }

      const quidaxService = new QuidaxServerService(quidaxSecretKey);
      const quidaxResponse = await quidaxService.createSubAccount(
        email,
        firstName,
        lastName || ''
      );

      if (!quidaxResponse?.data?.id) {
        throw new Error('No Quidax ID returned');
      }

      quidaxId = quidaxResponse.data.id;
      console.log('Quidax sub-account created:', quidaxId);
    } catch (quidaxError) {
      console.error('Error creating Quidax sub-account:', quidaxError);
      return NextResponse.json(
        { error: 'Failed to create Quidax account' },
        { status: 500 }
      );
    }

    // Sign up the user in Supabase
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
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    // Update user metadata with Quidax ID
    if (signUpData.user) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          email: email,
          email_verified: true,
          first_name: firstName,
          last_name: lastName || '',
          full_name: `${firstName} ${lastName || ''}`.trim(),
          phone_verified: false,
          quidax_id: quidaxId,
          sub: signUpData.user.id
        }
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
      }
    }

    // Generate a unique referral code
    const newReferralCode = nanoid(8);

    // Create user profile
    if (signUpData.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: signUpData.user.id,
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
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to create user profile', details: profileError.message },
          { status: 500 }
        );
      }

      // Update referrer's stats if applicable
      if (referralCode) {
        // First get current referral count
        const { data: referrer } = await supabase
          .from('user_profiles')
          .select('referral_count')
          .eq('referral_code', referralCode)
          .single();

        const { error: referrerUpdateError } = await supabase
          .from('user_profiles')
          .update({
            referral_count: (referrer?.referral_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('referral_code', referralCode);

        if (referrerUpdateError) {
          console.error('Error updating referrer stats:', referrerUpdateError);
        }
      }
    }

    // Sign in the user immediately
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.error('Error signing in after signup:', signInError);
      return NextResponse.json(
        { error: 'Failed to sign in after signup' },
        { status: 500 }
      );
    }

    // Return success with session
    return NextResponse.json({
      success: true,
      data: {
        user: signInData.user,
        session: signInData.session,
        quidax_id: quidaxId
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
} 