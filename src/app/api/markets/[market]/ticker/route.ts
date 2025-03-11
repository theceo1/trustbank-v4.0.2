import { NextResponse } from 'next/server';

const QUIDAX_API_URL = 'https://www.quidax.com/api/v1';

// Validate market parameter
function isValidMarket(market: string): boolean {
  const validMarkets = ['usdtngn', 'btcngn', 'ethngn', 'btcusdt', 'ethusdt'];
  return validMarkets.includes(market.toLowerCase());
}

export async function GET(
  request: Request,
  { params }: { params: { market: string } }
) {
  try {
    const market = params.market.toLowerCase();

    if (!isValidMarket(market)) {
      return NextResponse.json(
        { error: 'Invalid market' },
        { status: 400 }
      );
    }

    const response = await fetch(`${QUIDAX_API_URL}/markets/${market}/ticker`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Market not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to fetch market rate');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching market rate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market rate' },
      { status: 500 }
    );
  }
} 