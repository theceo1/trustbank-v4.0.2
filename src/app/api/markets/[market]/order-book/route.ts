import { NextResponse } from 'next/server';

const QUIDAX_API_URL = 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

// Validate market parameter
function isValidMarket(market: string): boolean {
  const validMarkets = [
    'qdxusdt', 'btcusdt', 'btcngn', 'ethngn', 'qdxngn', 'xrpngn', 
    'dashngn', 'ltcngn', 'usdtngn', 'btcghs', 'usdtghs', 'trxngn', 
    'dogeusdt', 'bnbusdt', 'maticusdt', 'safemoonusdt', 'aaveusdt', 
    'shibusdt', 'dotusdt', 'linkusdt', 'cakeusdt', 'xlmusdt', 'xrpusdt', 
    'ltcusdt', 'ethusdt', 'trxusdt', 'axsusdt', 'wsgusdt', 'afenusdt', 
    'blsusdt', 'dashusdt'
  ];
  return validMarkets.includes(market.toLowerCase());
}

export async function GET(
  request: Request,
  { params }: { params: { market: string } }
) {
  try {
    if (!QUIDAX_SECRET_KEY) {
      console.error('QUIDAX_SECRET_KEY is not defined');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const market = await params.market;

    if (!isValidMarket(market)) {
      return NextResponse.json(
        { error: 'Invalid market' },
        { status: 400 }
      );
    }

    // Get query parameters for limits
    const url = new URL(request.url);
    const askLimit = url.searchParams.get('ask_limit') || '20';
    const bidsLimit = url.searchParams.get('bids_limit') || '20';

    // Use the correct endpoint from the documentation
    const response = await fetch(
      `${QUIDAX_API_URL}/markets/${market}/order_book?ask_limit=${askLimit}&bids_limit=${bidsLimit}`,
      {
        headers: {
          'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Quidax API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Market not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to fetch order book');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching order book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order book' },
      { status: 500 }
    );
  }
} 