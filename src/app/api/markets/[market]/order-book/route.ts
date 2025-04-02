import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const QUIDAX_API_URL = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis client
const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL || '',
  token: UPSTASH_REDIS_REST_TOKEN || ''
});

const CACHE_TTL = 5; // 5 seconds

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

interface QuidaxOrder {
  id: string;
  side: string;
  ord_type: string;
  price: string;
  volume: string;
  state: string;
}

interface QuidaxOrderBookResponse {
  status: string;
  message: string;
  data: {
    asks: QuidaxOrder[];
    bids: QuidaxOrder[];
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { market: string } }
) {
  try {
    // Safely access and validate market parameter
    const marketLower = params?.market?.toLowerCase();
    if (!marketLower || !isValidMarket(marketLower)) {
      return NextResponse.json(
        { error: 'Invalid market' },
        { status: 400 }
      );
    }

    const CACHE_KEY = `order_book:${marketLower}`;

    // Try to get from cache first
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    if (!QUIDAX_SECRET_KEY) {
      console.error('QUIDAX_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Add query parameters for limiting the number of orders
    const url = new URL(`${QUIDAX_API_URL}/markets/${marketLower}/order_book`);
    url.searchParams.append('ask_limit', '20');
    url.searchParams.append('bids_limit', '20');

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: CACHE_TTL }  // Next.js cache
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Quidax API error: ${response.status} - ${errorText}`);

      // Try to return stale cache if available
      const staleData = await redis.get(CACHE_KEY);
      if (staleData) {
        return NextResponse.json(staleData);
      }

      return NextResponse.json(
        { error: 'Failed to fetch order book data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform the data into the format expected by the OrderBook component
    const transformedData = {
      asks: data.data.asks
        .filter((order: any) => order.state === 'wait')
        .map((order: any) => ({
          price: order.price,
          volume: order.volume,
        })),
      bids: data.data.bids
        .filter((order: any) => order.state === 'wait')
        .map((order: any) => ({
          price: order.price,
          volume: order.volume,
        })),
      timestamp: new Date().toISOString(),
    };

    // Cache the transformed data
    await redis.set(CACHE_KEY, transformedData, {
      ex: CACHE_TTL
    });

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching order book:', error);

    // Try to return stale cache in case of error
    try {
      const CACHE_KEY = `order_book:${params?.market?.toLowerCase()}`;
      const staleData = await redis.get(CACHE_KEY);
      if (staleData) {
        return NextResponse.json(staleData);
      }
    } catch (cacheError) {
      console.error('Cache error:', cacheError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch order book data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 