import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClientDashboard from './ClientDashboard';

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

  // Get recent transactions from both tables
  const [{ data: recentTrades }, { data: recentSwaps }] = await Promise.all([
    supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('swap_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  // Format trades
  const formattedTrades = (recentTrades || []).map(trade => ({
    id: trade.id,
    type: trade.type,
    amount: Number(trade.amount),
    currency: trade.currency,
    status: trade.status,
    created_at: trade.created_at
  }));

  // Format swaps
  const formattedSwaps = (recentSwaps || []).map(swap => ({
    id: swap.id,
    type: 'swap',
    amount: Number(swap.from_amount),
    currency: swap.from_currency,
    to_amount: Number(swap.to_amount),
    to_currency: swap.to_currency,
    status: swap.status,
    created_at: swap.created_at
  }));

  // Combine and sort all transactions
  const recentTransactions = [...formattedTrades, ...formattedSwaps]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5); // Keep only the 5 most recent

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