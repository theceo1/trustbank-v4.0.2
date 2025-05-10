import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClientDashboard from './ClientDashboard';
import TransactionHistory from '@/components/TransactionHistory';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    redirect('/auth/login');
  }

  // Fetch user profile and verification history
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('verification_history')
    .eq('user_id', user.id)
    .single();

  const verificationHistory = profile?.verification_history || {};
  const hasBasicKyc = verificationHistory.email && 
                     verificationHistory.phone && 
                     verificationHistory.basic_info;
  const hasIntermediateKyc = verificationHistory.intermediate_info;
  const hasAdvancedKyc = verificationHistory.advanced_info;

  // Calculate 30-day trading volume
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch trades and swap transactions in parallel
  const [{ data: trades }, { data: swaps }] = await Promise.all([
    supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('swap_transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
  ]);

  // Calculate total trading volume from both trades and swaps
  const tradingVolume = (trades || []).reduce((sum, trade) => 
    sum + (Number(trade.amount) * Number(trade.price)), 0) +
    (swaps || []).reduce((sum, swap) => 
    sum + Number(swap.from_amount), 0);

  // Get user limits
  const { data: limits } = await supabase
    .from('user_limits')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch all recent transactions (including swaps, trades, deposits, withdrawals, transfers, referral_bonus, referral_commission, etc)
  const transactionsRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/transactions`, {
    headers: {
      'Cookie': cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    }
  });
  let recentTransactions = [];
  if (transactionsRes.ok) {
    const allTransactions = await transactionsRes.json();
    recentTransactions = (allTransactions || [])
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ClientDashboard
        user={user}
        kycStatus={{
          status: hasBasicKyc ? 'verified' : 'unverified',
          tier: hasBasicKyc ? 1 : 0
        }}
        limits={{
          withdrawal_limit: limits?.withdrawal_limit || 0,
          trading_limit: limits?.trading_limit || 10000000,
          withdrawal_used: limits?.withdrawal_used || 0,
          trading_used: tradingVolume || 0
        }}
        volumeTrades={trades || []}
        transactions={recentTransactions}
      />
    </div>
  );
} 