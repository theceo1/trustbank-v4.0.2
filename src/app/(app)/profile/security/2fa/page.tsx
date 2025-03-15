import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TwoFactorSetupClient from './TwoFactorSetupClient';

export default async function TwoFactorSetupPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (profileError || !profile) {
    redirect('/onboarding');
  }

  return (
    <div className="container flex justify-center items-center min-h-[calc(100vh-4rem)]">
      <TwoFactorSetupClient session={session} profile={profile} />
    </div>
  );
} 