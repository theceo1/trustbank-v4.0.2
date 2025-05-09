import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

type TransactionType = 'deposit' | 'withdrawal';
type TransactionStatus = 'pending' | 'completed' | 'failed';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  userId?: string;
  userName: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    description: string;
    reference: string;
    destination: string;
    source: string;
    notes?: string;
  };
}

export async function GET(req: NextRequest) {
  console.log('[TRANSACTIONS API] Starting request handling');
  try {
    console.log('[TRANSACTIONS API] Initializing Supabase client');
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Get query parameters
    const searchParams = new URL(req.url).searchParams;
    const type = searchParams.get('type') as TransactionType | null;
    const status = searchParams.get('status') as TransactionStatus | null;
    const search = searchParams.get('search');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    console.log('[TRANSACTIONS API] Query parameters:', {
      type,
      status,
      search,
      from,
      to
    });

    // Build base query for regular transactions
    console.log('[TRANSACTIONS API] Building regular transactions query');
    let query = supabase
      .from('transactions')
      .select(`
        *,
        platform_revenue!transaction_id(
          id,
          amount
        )
      `);

    // Build base query for swap transactions
    console.log('[TRANSACTIONS API] Building swap transactions query');
    let swapQuery = supabase
      .from('swap_transactions')
      .select(`
        *,
        user:users!user_id(
          id,
          email,
          user_profile:user_profiles(
            first_name,
            last_name
          )
        ),
        platform_revenue!swap_id(
          id,
          amount
        )
      `);

    // Apply filters to both queries
    if (type) {
      console.log('[TRANSACTIONS API] Applying type filter:', type);
      query = query.eq('type', type);
    }

    if (status) {
      console.log('[TRANSACTIONS API] Applying status filter:', status);
      query = query.eq('status', status);
      swapQuery = swapQuery.eq('status', status);
    }

    if (from) {
      console.log('[TRANSACTIONS API] Applying from date filter:', from);
      const fromDate = new Date(from).toISOString();
      query = query.gte('created_at', fromDate);
      swapQuery = swapQuery.gte('created_at', fromDate);
    }

    if (to) {
      console.log('[TRANSACTIONS API] Applying to date filter:', to);
      const toDate = new Date(to).toISOString();
      query = query.lte('created_at', toDate);
      swapQuery = swapQuery.lte('created_at', toDate);
    }

    // Fetch both regular and swap transactions
    console.log('[TRANSACTIONS API] Executing queries');
    const [{ data: transactionsData = [], error: transactionsError }, { data: swapData = [], error: swapError }] = await Promise.all([
      query,
      swapQuery
    ]);

    if (transactionsError) {
      console.error('[TRANSACTIONS API] Error fetching regular transactions:', {
        code: transactionsError.code,
        message: transactionsError.message,
        details: transactionsError.details,
        hint: transactionsError.hint
      });
      return NextResponse.json({ error: 'Failed to fetch transactions', details: transactionsError }, { status: 500 });
    }

    if (swapError) {
      console.error('[TRANSACTIONS API] Error fetching swap transactions:', {
        code: swapError.code,
        message: swapError.message,
        details: swapError.details,
        hint: swapError.hint
      });
      return NextResponse.json({ error: 'Failed to fetch swap transactions', details: swapError }, { status: 500 });
    }

    console.log('[TRANSACTIONS API] Successfully fetched data:', {
      regularTransactions: transactionsData?.length || 0,
      swapTransactions: swapData?.length || 0
    });

    // Transform transactions data
    console.log('[TRANSACTIONS API] Transforming transaction data');
    const transactions = [
      ...(transactionsData || []).map((tx: any) => ({
        id: tx.id,
        type: tx.type as TransactionType,
        amount: Number(tx.amount),
        currency: tx.currency,
        status: tx.status as TransactionStatus,
        userId: tx.user_id,
        userName: 'N/A', // Regular transactions don't have direct user info
        userEmail: null,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        metadata: {
          description: tx.description || `${tx.type.toUpperCase()} Transaction`,
          reference: tx.reference || tx.id,
          destination: tx.recipient_id || 'N/A',
          source: tx.user_id,
          fee: tx.platform_revenue?.[0]?.amount || 'N/A',
          // Expose korapay_fee and trustbank_fee for admin panel
          trustbank_fee: tx.metadata?.trustbank_fee ?? null,
          korapay_fee: tx.metadata?.korapay_fee ?? null
        }
      })),
      ...(swapData || []).map((tx: any) => ({
        id: tx.id,
        type: 'swap' as const,
        amount: Number(tx.from_amount),
        currency: tx.from_currency,
        status: tx.status as TransactionStatus,
        userId: tx.user_id,
        userName: tx.user?.user_profile?.first_name && tx.user?.user_profile?.last_name 
          ? `${tx.user.user_profile.first_name} ${tx.user.user_profile.last_name}`
          : tx.user?.email || 'Unknown User',
        userEmail: tx.user?.email,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        metadata: {
          description: `Swap ${tx.from_currency.toUpperCase()} to ${tx.to_currency.toUpperCase()}`,
          reference: tx.reference || tx.id,
          destination: tx.to_currency,
          source: tx.from_currency,
          notes: `Execution price: ${tx.execution_price}`,
          fee: tx.platform_revenue?.[0]?.amount || 'N/A'
        }
      }))
    ];

    // Apply search filter after combining transactions
    let filteredTransactions = transactions;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTransactions = transactions.filter((tx) => 
        tx.id.toLowerCase().includes(searchLower) ||
        tx.userName.toLowerCase().includes(searchLower) ||
        (tx.userEmail?.toLowerCase() || '').includes(searchLower) ||
        tx.metadata.reference.toLowerCase().includes(searchLower)
      );
    }

    // Sort transactions by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentPeriodTxs = filteredTransactions.filter(tx => 
      new Date(tx.createdAt) >= thirtyDaysAgo
    );
    const previousPeriodTxs = filteredTransactions.filter(tx => 
      new Date(tx.createdAt) >= sixtyDaysAgo && new Date(tx.createdAt) < thirtyDaysAgo
    );

    // Calculate current period stats
    const currentVolume = currentPeriodTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const currentSuccessful = currentPeriodTxs.filter(tx => tx.status === 'completed').length;
    const currentFailed = currentPeriodTxs.filter(tx => tx.status === 'failed').length;
    const currentTotal = currentPeriodTxs.length;

    // Calculate previous period stats
    const previousVolume = previousPeriodTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const previousSuccessful = previousPeriodTxs.filter(tx => tx.status === 'completed').length;
    const previousFailed = previousPeriodTxs.filter(tx => tx.status === 'failed').length;
    const previousTotal = previousPeriodTxs.length;

    // Calculate percentage changes
    const volumeChange = previousVolume === 0 ? 100 : ((currentVolume - previousVolume) / previousVolume) * 100;
    const successRateChange = previousTotal === 0 ? 0 : 
      ((currentSuccessful / currentTotal) - (previousSuccessful / previousTotal)) * 100;
    const failureRateChange = previousTotal === 0 ? 0 : 
      ((currentFailed / currentTotal) - (previousFailed / previousTotal)) * 100;

    const stats = {
      totalVolume: filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      successfulTransactions: filteredTransactions.filter(tx => tx.status === 'completed').length,
      failedTransactions: filteredTransactions.filter(tx => tx.status === 'failed').length,
      pendingTransactions: filteredTransactions.filter(tx => tx.status === 'pending').length,
      volumeChange: Math.round(volumeChange * 100) / 100,
      successRateChange: Math.round(successRateChange * 100) / 100,
      failureRateChange: Math.round(failureRateChange * 100) / 100
    };

    console.log('[TRANSACTIONS API] Preparing response with:', {
      totalTransactions: transactions.length,
      stats: {
        totalVolume: stats.totalVolume,
        successfulTransactions: stats.successfulTransactions,
        failedTransactions: stats.failedTransactions,
        pendingTransactions: stats.pendingTransactions
      }
    });

    return NextResponse.json({
      transactions,
      stats,
      pagination: {
        total: filteredTransactions.length,
        page: 1,
        perPage: filteredTransactions.length
      }
    });

  } catch (error: any) {
    console.error('[TRANSACTIONS API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch transactions',
        details: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      },
      { status: 500 }
    );
  }
} 