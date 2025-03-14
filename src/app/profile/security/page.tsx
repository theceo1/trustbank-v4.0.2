import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SecuritySettings from '@/components/profile/SecuritySettings';
import ClientSecurityPage from './ClientSecurityPage';

export default async function SecurityPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Get session server-side
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login?redirect=/profile/security');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  // Get 2FA status
  const { data: twoFactorData } = await supabase
    .from('two_factor_auth')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  // Get active sessions
  const { data: activeSessions } = await supabase
    .from('active_sessions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('last_active', { ascending: false });

  return (
    <ClientSecurityPage
      session={session}
      profile={profile}
      twoFactorData={twoFactorData}
      activeSessions={activeSessions || []}
    />
  );
} 