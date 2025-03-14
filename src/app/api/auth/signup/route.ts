// src/app/api/auth/signup/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

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

    // Create the user in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName || '',
          full_name: `${firstName} ${lastName || ''}`.trim(),
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Generate a unique referral code for the new user
    const newReferralCode = nanoid(8);

    // Create user profile with referral information
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: data.user.id,
            first_name: firstName,
            last_name: lastName || '',
            full_name: `${firstName} ${lastName || ''}`.trim(),
            email: email,
            referral_code: newReferralCode,
            referred_by: referralCode || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Don't return error to client as user is already created
      }

      // If user was referred, update referrer's stats
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('user_profiles')
          .select('user_id, referral_count')
          .eq('referral_code', referralCode)
          .single();

        if (referrer) {
          await supabase
            .from('user_profiles')
            .update({ 
              referral_count: (referrer.referral_count || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', referrer.user_id);
        }
      }
    }

    return NextResponse.json({
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
} 