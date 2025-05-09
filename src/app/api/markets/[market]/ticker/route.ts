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

    // Special handling for USD/NGN and NGN/USD markets
    if (marketLower === 'usdngn' || marketLower === 'ngnusd') {
      // Try direct fetch first
      const directResponse = await fetch(`${QUIDAX_API_URL}/markets/tickers/${marketLower}`, {
        headers: {
          'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        cache: 'no-store'
      });
      let useFallback = false;
      let ticker = null;
      if (directResponse.ok) {
        const directData = await directResponse.json();
        if (directData && directData.data && directData.data.ticker && directData.data.ticker.last) {
          ticker = directData.data.ticker;
        } else {
          useFallback = true;
        }
      } else {
        useFallback = true;
        
      }
      if (!useFallback && ticker) {
        // Normal transformation as before
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
        await redis.set(`market_ticker:${marketLower}`, transformedData, { ex: CACHE_TTL });
        return NextResponse.json({ status: 'success', data: transformedData, source: 'api' });
      }
      // Fallback: Compose USD/NGN using USDT as bridge
      try {
        // Fetch USDT/NGN
        const usdtngnResp = await fetch(`${QUIDAX_API_URL}/markets/tickers/usdtngn`, {
          headers: {
            'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          cache: 'no-store'
        });
        // Try USDT/USD first
        const usdtusdResp = await fetch(`${QUIDAX_API_URL}/markets/tickers/usdtusd`, {
          headers: {
            'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          cache: 'no-store'
        });
        let usdtngn = null, usdtusd = null;
        if (usdtngnResp.ok) {
          const usdtngnData = await usdtngnResp.json();
          usdtngn = usdtngnData?.data?.ticker?.last ? parseFloat(usdtngnData.data.ticker.last) : null;
        }
        if (usdtusdResp.ok) {
          const usdtusdData = await usdtusdResp.json();
          usdtusd = usdtusdData?.data?.ticker?.last ? parseFloat(usdtusdData.data.ticker.last) : null;
        }
        // If USDT/USD not available, try USD/USDT and invert
        if (!usdtusd) {
          const usdusdtResp = await fetch(`${QUIDAX_API_URL}/markets/tickers/usdusdt`, {
            headers: {
              'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            cache: 'no-store'
          });
          if (usdusdtResp.ok) {
            const usdusdtData = await usdusdtResp.json();
            const usdusdt = usdusdtData?.data?.ticker?.last ? parseFloat(usdusdtData.data.ticker.last) : null;
            if (usdusdt && usdusdt !== 0) usdtusd = 1 / usdusdt;
          }
        }
        if (usdtngn && usdtusd) {
          // USD/NGN = USDT/NGN / USDT/USD
          const usdngn = usdtngn / usdtusd;
          const transformedData = {
            pair: marketLower.toUpperCase(),
            price: usdngn.toString(),
            priceChangePercent: '0.00', // Not available from composed route
            volume: '0',
            high: '0',
            low: '0',
            lastUpdated: new Date().toISOString(),
            derived: true
          };
          await redis.set(`market_ticker:${marketLower}`, transformedData, { ex: CACHE_TTL });
          return NextResponse.json({ status: 'success', data: transformedData, source: 'derived' });
        } else {
          
          return NextResponse.json({ error: 'Could not derive USD/NGN rate from Quidax', details: { usdtngn, usdtusd } }, { status: 502 });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: 'Error deriving USD/NGN rate from Quidax', details: errorMessage }, { status: 502 });
      }
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
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 