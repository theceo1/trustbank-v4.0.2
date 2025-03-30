import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface Ticker {
  buy: string;
  sell: string;
  low: string;
  high: string;
  open: string;
  last: string;
  vol: string;
}

interface QuidaxTickers {
  [market: string]: {
    ticker: Ticker;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from')?.toUpperCase();
    const to = searchParams.get('to')?.toUpperCase();

    // Fetch market tickers from Quidax
    const tickersResponse = await fetch('https://www.quidax.com/api/v1/markets/tickers', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!tickersResponse.ok) {
      throw new Error('Failed to fetch market tickers');
    }

    const tickers = await tickersResponse.json() as { data: QuidaxTickers };
    
    // If specific currencies are requested, return single rate
    if (from && to) {
      // Helper function to find rate through a bridge currency
      const findRateViaBridge = (fromCurrency: string, toCurrency: string, bridgeCurrency: string): number | null => {
        const fromBridgeMarket = `${fromCurrency.toLowerCase()}${bridgeCurrency.toLowerCase()}`;
        const toBridgeMarket = `${toCurrency.toLowerCase()}${bridgeCurrency.toLowerCase()}`;
        
        const fromRate = tickers.data[fromBridgeMarket]?.ticker.last;
        const toRate = tickers.data[toBridgeMarket]?.ticker.last;
        
        if (fromRate && toRate) {
          return parseFloat(fromRate) / parseFloat(toRate);
        }
        return null;
      };

      // Try direct pair
      const directMarket = `${from.toLowerCase()}${to.toLowerCase()}`;
      if (tickers.data[directMarket]) {
        return NextResponse.json({ 
          rate: parseFloat(tickers.data[directMarket].ticker.last),
          source: 'direct'
        });
      }

      // Try inverse pair
      const inverseMarket = `${to.toLowerCase()}${from.toLowerCase()}`;
      if (tickers.data[inverseMarket]) {
        return NextResponse.json({ 
          rate: 1 / parseFloat(tickers.data[inverseMarket].ticker.last),
          source: 'inverse'
        });
      }

      // Try through USDT
      const usdtRate = findRateViaBridge(from, to, 'USDT');
      if (usdtRate !== null) {
        return NextResponse.json({ 
          rate: usdtRate,
          source: 'usdt_bridge'
        });
      }

      // Try through NGN
      const ngnRate = findRateViaBridge(from, to, 'NGN');
      if (ngnRate !== null) {
        return NextResponse.json({ 
          rate: ngnRate,
          source: 'ngn_bridge'
        });
      }

      return NextResponse.json(
        { error: 'Rate not available for this pair' },
        { status: 404 }
      );
    }
    
    // If no specific currencies requested, return all rates
    const rates: Record<string, number> = {};
    Object.entries(tickers.data).forEach(([market, data]) => {
      if (data.ticker && data.ticker.last) {
        rates[market.toUpperCase()] = parseFloat(data.ticker.last);
      }
    });

    return NextResponse.json({ rates });

  } catch (error) {
    console.error('Error fetching market rate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 