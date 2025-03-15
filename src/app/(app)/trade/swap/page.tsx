import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SwapClient from './SwapClient';

export const metadata = {
  title: 'Swap Trading | TrustBank',
  description: 'Instantly swap between different cryptocurrencies at the best rates.',
};

export default async function SwapPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login?redirect=/trade/swap');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  return <SwapClient />;
} 