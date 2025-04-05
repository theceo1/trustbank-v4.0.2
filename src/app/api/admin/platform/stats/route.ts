import { NextResponse } from 'next/server';
import { createQuidaxServer } from '@/lib/quidax';

interface QuidaxUser {
  id: string;
  email: string;
  status: string;
}

interface QuidaxWallet {
  currency: string;
  balance: string;
  locked: string;
}

interface QuidaxSwapTransaction {
  id: string;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  received_amount: string;
  execution_price: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface QuidaxUserResponse {
  status: string;
  message: string;
  data: QuidaxUser;
}

interface QuidaxWalletsResponse {
  status: string;
  message: string;
  data: QuidaxWallet[];
}

interface QuidaxSwapTransactionsResponse {
  status: string;
  message: string;
  data: QuidaxSwapTransaction[];
}

interface PlatformStatsResponse {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  totalWallets: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    console.log('[STATS] Initializing Quidax client');
    const quidax = createQuidaxServer();
    
    console.log('[STATS] Starting data fetch');
    const [userResponse, walletsResponse, transactionsResponse] = await Promise.all([
      quidax.request<QuidaxUserResponse>('/users/me'),
      quidax.request<QuidaxWalletsResponse>('/users/me/wallets'),
      quidax.request<QuidaxSwapTransactionsResponse>('/users/me/swap_transactions?limit=100')
        .catch(e => {
          console.log('[STATS] Transactions fetch error:', e.response?.status, e.message);
          if (e.response?.status === 404) {
            return { status: 'success', message: 'Not found', data: [] } as QuidaxSwapTransactionsResponse;
          }
          throw e;
        })
    ]);

    console.log('[STATS] API responses received:', {
      user: Boolean(userResponse?.data),
      wallets: walletsResponse?.data?.length,
      transactions: transactionsResponse?.data?.length
    });

    // Process data with proper typing
    const stats: PlatformStatsResponse = {
      totalUsers: 1,
      activeUsers: userResponse.data.status === 'active' ? 1 : 0,
      totalTransactions: transactionsResponse.data
        .filter((tx: QuidaxSwapTransaction) => tx.status === 'completed').length,
      totalVolume: transactionsResponse.data
        .filter((tx: QuidaxSwapTransaction) => tx.status === 'completed')
        .reduce((sum: number, tx: QuidaxSwapTransaction) => sum + parseFloat(tx.from_amount), 0),
      totalWallets: walletsResponse.data.length
    };

    console.log('[STATS] Processed stats:', stats);

    // Return properly formatted response
    const response = {
      status: 'success',
      message: 'Platform stats retrieved',
      data: stats,
      lastUpdated: new Date().toISOString()
    };

    console.log('[STATS] Final response:', response);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[STATS] Endpoint error:', {
      message: error.message,
      status: error.response?.status,
      stack: error.stack
    });
    return NextResponse.json(
      { status: 'error', message: error.message, details: error.response?.data },
      { status: error.response?.status || 500 }
    );
  }
}