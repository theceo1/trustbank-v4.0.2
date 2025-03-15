import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const QUIDAX_API_URL = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

// Debug log
console.log('API URL:', QUIDAX_API_URL);
console.log('Secret key loaded:', !!QUIDAX_SECRET_KEY);

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
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!QUIDAX_SECRET_KEY) {
      console.error('QUIDAX_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const marketLower = params.market.toLowerCase();

    if (!isValidMarket(marketLower)) {
      return NextResponse.json(
        { error: 'Invalid market' },
        { status: 400 }
      );
    }

    // Fetch market ticker from Quidax - using the tickers endpoint instead
    const response = await fetch(`${QUIDAX_API_URL}/tickers/${marketLower}`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store'  // Disable caching to get real-time data
    });

    if (!response.ok) {
      console.error(`Quidax API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Quidax API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.data || !data.data.ticker) {
      console.error('Invalid response from Quidax API:', data);
      throw new Error('Invalid response format from Quidax API');
    }

    const ticker = data.data.ticker;
    const last = parseFloat(ticker.last || '0');
    const open = parseFloat(ticker.open || '0');
    const priceChangePercent = open === 0 ? 0 : ((last - open) / open) * 100;

    return NextResponse.json({
      status: 'success',
      data: {
        pair: marketLower.toUpperCase(),
        price: ticker.last || '0',
        priceChangePercent: priceChangePercent.toFixed(2),
        volume: ticker.vol || '0',
        high: ticker.high || '0',
        low: ticker.low || '0',
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching market ticker:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch market data' },
      { status: 500 }
    );
  }
} 