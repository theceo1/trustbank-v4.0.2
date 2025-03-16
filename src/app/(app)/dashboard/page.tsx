'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClientDashboard from './ClientDashboard';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    return redirect('/auth/login');
  }

  // Fetch KYC status
  const { data: kycData } = await supabase
    .from('kyc_verifications')
    .select('status')
    .eq('user_id', user.id)
    .single();

  // Calculate 30-day trading volume
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: volumeTrades } = await supabase
    .from('trades')
    .select('amount,price')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString());

  const tradingVolume = volumeTrades?.reduce((sum, trade) => 
    sum + (Number(trade.amount) * Number(trade.price)), 0) || 0;

  // Get user limits
  const { data: limits } = await supabase
    .from('user_limits')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get recent transactions
  const { data: recentTransactions } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <ClientDashboard
      user={user}
      kycStatus={{ status: kycData?.status || 'unverified', tier: 0 }}
      limits={{
        withdrawal_limit: limits?.withdrawal_limit || 0,
        trading_limit: limits?.trading_limit || 0,
        withdrawal_used: limits?.withdrawal_used || 0,
        trading_used: tradingVolume
      }}
      volumeTrades={volumeTrades || []}
      transactions={recentTransactions || []}
    />
  );
} 