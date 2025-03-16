import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ClientKYCPage from './ClientKYCPage';

export const metadata: Metadata = {
  title: 'KYC Verification - trustBank',
  description: 'Complete your KYC verification to unlock full account features',
  other: {
    'permissions-policy': 'camera=(self), microphone=(self)',
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob:;
      media-src 'self' blob: mediastream:;
      connect-src 'self' https://*.supabase.co https://*.dojah.io;
      frame-src 'self';
      object-src 'self' data:;
    `.replace(/\s+/g, ' ').trim()
  }
};

export default async function KYCPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  }, {
    options: {
      global: {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    },
  });
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // Get user's profile if user exists
  let profile = null;
  if (user) {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    profile = userProfile;
  }

  return <ClientKYCPage initialProfile={profile} />;
}