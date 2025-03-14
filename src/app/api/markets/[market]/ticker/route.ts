import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
    // Initialize Supabase client with cookies
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
      console.error('QUIDAX_SECRET_KEY is not defined');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Get market parameter and convert to lowercase
    const market = params.market.toLowerCase();

    if (!isValidMarket(market)) {
      return NextResponse.json(
        { error: 'Invalid market' },
        { status: 400 }
      );
    }

    // Use the correct endpoint format
    const response = await fetch(`${QUIDAX_API_URL}/markets/${market}/ticker`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Quidax API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || !data.data.ticker) {
      throw new Error('Invalid response format from Quidax API');
    }

    // Calculate price change percentage
    const last = parseFloat(data.data.ticker.last);
    const open = parseFloat(data.data.ticker.open);
    const priceChangePercent = ((last - open) / open) * 100;

    return NextResponse.json({
      status: 'success',
      data: {
        pair: market.toUpperCase(),
        price: data.data.ticker.last,
        priceChangePercent: priceChangePercent.toFixed(2),
        volume: data.data.ticker.vol,
        lastUpdated: new Date().toLocaleTimeString()
      }
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
} 