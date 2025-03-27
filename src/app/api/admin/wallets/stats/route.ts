import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const quidaxApiKey = process.env.QUIDAX_API_KEY;
    const quidaxBaseUrl = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';

    // Fetch all wallets from Quidax
    const response = await fetch(`${quidaxBaseUrl}/users/me/wallets`, {
      headers: {
        'Authorization': `Bearer ${quidaxApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch wallets');
    }

    const data = await response.json();
    const wallets = data.data || [];

    // Calculate total balance in USD
    let totalBalanceUSD = 0;
    let activeWallets = 0;

    for (const wallet of wallets) {
      if (parseFloat(wallet.balance) > 0) {
        // Convert balance to USD using current market rate
        const marketResponse = await fetch(
          `${quidaxBaseUrl}/quotes?market=${wallet.currency}usdt&unit=${wallet.currency}&kind=bid&volume=${wallet.balance}`
        );
        
        if (marketResponse.ok) {
          const marketData = await marketResponse.json();
          if (marketData.data?.total?.amount) {
            totalBalanceUSD += parseFloat(marketData.data.total.amount);
          }
        }

        activeWallets++;
      }
    }

    // Get total number of transactions
    const { count: totalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      totalBalanceUSD,
      totalTransactions: totalTransactions || 0,
      activeWallets,
    });
  } catch (error) {
    console.error('Error fetching wallet stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet statistics' },
      { status: 500 }
    );
  }
}