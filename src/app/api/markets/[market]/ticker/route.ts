import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const QUIDAX_API_URL = process.env.QUIDAX_API_URL || process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis client
const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL || '',
  token: UPSTASH_REDIS_REST_TOKEN || ''
});

// Cache TTL in seconds
const CACHE_TTL = 5;

// Debug log
console.log('API URL:', QUIDAX_API_URL);
console.log('Secret key loaded:', !!QUIDAX_SECRET_KEY);
console.log('Redis configured:', !!(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN));

// Dynamically validate market parameter using SUPPORTED_CURRENCIES
import { SUPPORTED_CURRENCIES } from 'src/config/supportedCurrencies';

function isValidMarket(market: string): boolean {
  if (!market || typeof market !== 'string' || market.length < 6) return false;
  const lower = market.toLowerCase();
  // Try all possible base/quote splits (from 3/3 to 5/5)
  for (let i = 3; i <= Math.min(5, lower.length - 3); i++) {
    const base = lower.slice(0, i).toUpperCase();
    const quote = lower.slice(i).toUpperCase();
    const baseOk = SUPPORTED_CURRENCIES.some(c => c.code === base);
    const quoteOk = SUPPORTED_CURRENCIES.some(c => c.code === quote);
    if (baseOk && quoteOk) return true;
  }
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { market: string } }
) {
  try {
    if (!QUIDAX_SECRET_KEY) {
      console.error('QUIDAX_SECRET_KEY is not configured');
      return NextResponse.json(
        { 
          error: 'API configuration error',
          details: 'Missing API key'
        },
        { status: 500 }
      );
    }

    // Safely access and validate market parameter
    const marketLower = params?.market?.toLowerCase();
    if (!marketLower || !isValidMarket(marketLower)) {
      return NextResponse.json(
        { 
          error: 'Invalid market',
          details: `Market ${marketLower} is not supported`
        },
        { status: 400 }
      );
    }

    // Try to get from cache first
    const CACHE_KEY = `market_ticker:${marketLower}`;
    const cachedData = await redis.get(CACHE_KEY);
    
    if (cachedData) {
      return NextResponse.json({
        status: 'success',
        data: cachedData,
        source: 'cache'
      });
    }

    // If not in cache, fetch from Quidax API
    const response = await fetch(`${QUIDAX_API_URL}/markets/tickers/${marketLower}`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store'  // Disable caching to get real-time data
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Quidax API error:', response.status, response.statusText);
      console.error('Error response:', errorText);
      
      // Try to return stale cache if available
      const staleData = await redis.get(CACHE_KEY);
      if (staleData) {
        return NextResponse.json({
          status: 'success',
          data: staleData,
          source: 'stale_cache'
        });
      }

      return NextResponse.json(
        { 
          error: 'Failed to fetch market data',
          details: errorText,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data || !data.data || !data.data.ticker) {
      console.error('Invalid response from Quidax API:', data);
      return NextResponse.json(
        { 
          error: 'Invalid response format from Quidax API',
          details: 'Response missing required data'
        },
        { status: 500 }
      );
    }

    const ticker = data.data.ticker;
    const last = parseFloat(ticker.last || '0');
    const open = parseFloat(ticker.open || '0');
    const priceChangePercent = open === 0 ? 0 : ((last - open) / open) * 100;

    const transformedData = {
      pair: marketLower.toUpperCase(),
      price: ticker.last || '0',
      priceChangePercent: priceChangePercent.toFixed(2),
      volume: ticker.vol || '0',
      high: ticker.high || '0',
      low: ticker.low || '0',
      lastUpdated: new Date().toISOString()
    };

    // Cache the transformed data
    await redis.set(CACHE_KEY, transformedData, {
      ex: CACHE_TTL
    });

    return NextResponse.json({
      status: 'success',
      data: transformedData,
      source: 'api'
    });
  } catch (error) {
    console.error('Error fetching market ticker:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 