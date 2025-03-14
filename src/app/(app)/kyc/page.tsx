import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClientKYCPage from './ClientKYCPage';

export const metadata: Metadata = {
  title: 'KYC Verification - TrustBank',
  description: 'Complete your KYC verification to unlock full account features',
  other: {
    'permissions-policy': 'camera=(self), microphone=(self)',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: mediastream:; connect-src 'self' https://*.supabase.co https://*.dojah.io; frame-src 'self'"
  }
};

export default async function KYCPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ 
    cookies: async () => cookieStore 
  });
  
  // Get authenticated user data
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    redirect('/auth/login?redirect=/kyc');
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  return <ClientKYCPage />;
} 