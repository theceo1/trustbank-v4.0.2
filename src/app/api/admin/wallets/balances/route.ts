import { NextResponse } from 'next/server';

export async function GET() {
  try {
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

    // Get addresses and USD values for each wallet
    const balances = await Promise.all(
      wallets.map(async (wallet: any) => {
        // Fetch wallet address
        const addressResponse = await fetch(
          `${quidaxBaseUrl}/users/me/wallets/${wallet.currency}/address`,
          {
            headers: {
              'Authorization': `Bearer ${quidaxApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        let address = '';
        let network = '';

        if (addressResponse.ok) {
          const addressData = await addressResponse.json();
          if (addressData.data?.address) {
            address = addressData.data.address;
            network = addressData.data.network;
          }
        }

        // Get USD value
        let usdValue = 0;
        if (parseFloat(wallet.balance) > 0) {
          const marketResponse = await fetch(
            `${quidaxBaseUrl}/quotes?market=${wallet.currency}usdt&unit=${wallet.currency}&kind=bid&volume=${wallet.balance}`
          );
          
          if (marketResponse.ok) {
            const marketData = await marketResponse.json();
            if (marketData.data?.total?.amount) {
              usdValue = parseFloat(marketData.data.total.amount);
            }
          }
        }

        return {
          currency: wallet.currency,
          balance: wallet.balance,
          usdValue,
          address,
          network,
        };
      })
    );

    return NextResponse.json(balances);
  } catch (error) {
    console.error('Error fetching wallet balances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet balances' },
      { status: 500 }
    );
  }
} 