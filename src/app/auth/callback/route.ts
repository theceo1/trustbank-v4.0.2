import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { QuidaxService } from '@/lib/quidax'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  console.log('🔄 Auth callback - Processing request');
  
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    console.warn('⚠️ No auth code provided in callback');
    return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
  }

  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Exchange the code for a session
    console.log('📝 Auth code received, exchanging for session');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ Error exchanging code for session:', error);
      throw error;
    }

    const user = data.user;
    if (!user) {
      console.error('❌ No user data received after session exchange');
      throw new Error('No user data received');
    }

    console.log('✅ Session established for user:', user.email);
    console.log('📝 User metadata:', JSON.stringify(user.user_metadata, null, 2));

    // Check if user profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', user.id)
      .single();

    console.log('📝 Existing profile check:', { existingProfile, profileError });

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('❌ Error checking existing profile:', profileError);
      throw profileError;
    }

    // If profile exists and has a Quidax ID, proceed to dashboard
    if (existingProfile?.quidax_id) {
      console.log('✅ User already has Quidax account:', existingProfile.quidax_id);
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }

    // Create Quidax sub-account for new users
    console.log('📝 Creating Quidax sub-account');
      
    if (!process.env.QUIDAX_SECRET_KEY) {
      console.error('❌ Quidax secret key is missing');
      throw new Error('Quidax secret key is not configured');
    }

    const quidaxService = new QuidaxService(process.env.QUIDAX_SECRET_KEY);
      
    // Get name from various possible sources
    const firstName = user.user_metadata.name?.split(' ')[0] || 
                    user.user_metadata.full_name?.split(' ')[0] || 
                    user.user_metadata.given_name ||
                    'User';
    const lastName = user.user_metadata.name?.split(' ').slice(1).join(' ') || 
                    user.user_metadata.full_name?.split(' ').slice(1).join(' ') ||
                    user.user_metadata.family_name ||
                    'Account';
      
    console.log('📝 Attempting to create Quidax account with:', {
      email: user.email,
      firstName,
      lastName
    });

    try {
      const quidaxAccount = await quidaxService.createSubAccount({
        email: user.email!,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        metadata: {
          source: 'google',
          provider_id: user.user_metadata.provider_id,
          email_verified: user.user_metadata.email_verified
        }
      });

      console.log('✅ Quidax account created:', quidaxAccount.id);

      // Update user profile with Quidax ID
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          quidax_id: quidaxAccount.id,
          quidax_sn: quidaxAccount.id,
          referral_code: nanoid(10),
          kyc_level: 'basic',
          kyc_verified: false,
          verification_history: {
            email: true,
            phone: false,
            basic_info: false,
            identity: false,
            address: false
          }
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('❌ Error updating user profile:', updateError);
        throw updateError;
      }

      console.log('✅ User profile updated with Quidax ID');
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));

    } catch (err) {
      console.error('❌ Error in account setup:', err);
      throw err;
    }

  } catch (err) {
    console.error('❌ Unexpected error in auth callback:', err);
    const loginUrl = new URL('/auth/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'Unexpected error occurred')
    return NextResponse.redirect(loginUrl)
  }
} 