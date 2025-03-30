import { NextResponse } from 'next/server';
import { quidaxService } from '@/lib/quidax';

// Approximate circulating supplies as of 2024
const CIRCULATING_SUPPLIES = {
  BTC: 19_600_000, // ~19.6M BTC in circulation
  ETH: 120_000_000, // ~120M ETH in circulation
};

interface QuidaxTicker {
  ticker: {
    last: string;
    vol: string;
    buy: string;
    sell: string;
    low: string;
    high: string;
    open: string;
  };
}

interface QuidaxMarketTickers {
  [key: string]: QuidaxTicker;
}

const QUIDAX_API_URL = process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1';

export async function GET() {
  try {
    // Fetch market tickers with error handling
    const tickersResponse = await fetch(`${QUIDAX_API_URL}/markets/tickers`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!tickersResponse.ok) {
      const errorText = await tickersResponse.text();
      console.error('Quidax API error:', {
        status: tickersResponse.status,
        statusText: tickersResponse.statusText,
        body: errorText,
        url: `${QUIDAX_API_URL}/markets/tickers`
      });
      throw new Error(`Failed to fetch market tickers: ${tickersResponse.statusText}`);
    }

    const response = await tickersResponse.json();
    console.log('Raw API Response:', response);

    // Ensure we have data and it's in the expected format
    if (!response?.data || typeof response.data !== 'object') {
      throw new Error('Invalid response format from Quidax API');
    }

    const tickers = response.data as QuidaxMarketTickers;
    const markets = Object.keys(tickers);
    console.log('Available markets:', markets);

    // Get BTC/USDT and ETH/USDT prices
    const btcTicker = tickers['btcusdt']?.ticker;
    const ethTicker = tickers['ethusdt']?.ticker;
    const usdtUsdTicker = tickers['usdtusd']?.ticker;

    console.log('BTC Ticker:', btcTicker);
    console.log('ETH Ticker:', ethTicker);
    console.log('USDT/USD Ticker:', usdtUsdTicker);

    if (!btcTicker || !ethTicker) {
      throw new Error('Unable to get BTC/USDT or ETH/USDT tickers');
    }

    const btcPrice = parseFloat(btcTicker.last);
    const ethPrice = parseFloat(ethTicker.last);

    if (isNaN(btcPrice) || isNaN(ethPrice)) {
      throw new Error('Invalid price data received');
    }

    console.log('BTC Price:', btcPrice);
    console.log('ETH Price:', ethPrice);

    // Calculate trading volume (24h)
    let tradingVolume24h = 0;
    Object.entries(tickers).forEach(([pair, data]) => {
      if (pair.endsWith('usdt')) {
        const price = parseFloat(data.ticker.last);
        const volume = parseFloat(data.ticker.vol);
        if (!isNaN(price) && !isNaN(volume)) {
          tradingVolume24h += price * volume;
        }
      }
    });

    // Calculate market caps
    const btcMarketCap = btcPrice * CIRCULATING_SUPPLIES.BTC;
    const ethMarketCap = ethPrice * CIRCULATING_SUPPLIES.ETH;
    const totalMarketCap = btcMarketCap + ethMarketCap;

    // Calculate BTC dominance
    const btcDominance = totalMarketCap > 0 ? (btcMarketCap / totalMarketCap) * 100 : 0;

    const result = {
      success: true,
      data: {
        total_market_cap: totalMarketCap,
        trading_volume_24h: tradingVolume24h,
        btc_dominance: btcDominance,
        btc_price: btcPrice,
        eth_price: ethPrice,
        // Include individual market data for the UI
        markets: {
          'usdt/usd': usdtUsdTicker || null,
          'btc/usdt': btcTicker || null,
          'eth/usdt': ethTicker || null,
          'xrp/usdt': tickers['xrpusdt']?.ticker || null,
          'sol/usdt': tickers['solusdt']?.ticker || null,
          'ada/usdt': tickers['adausdt']?.ticker || null,
          'doge/usdt': tickers['dogeusdt']?.ticker || null,
          'matic/usdt': tickers['maticusdt']?.ticker || null,
          'dot/usdt': tickers['dotusdt']?.ticker || null
        }
      }
    };

    console.log('Final response:', JSON.stringify(result, null, 2));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to fetch market overview',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 