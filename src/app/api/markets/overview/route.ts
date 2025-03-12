import { NextResponse } from 'next/server';

const QUIDAX_API_URL = 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

export async function GET() {
  try {
    if (!QUIDAX_SECRET_KEY) {
      console.error('QUIDAX_SECRET_KEY is not defined');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Fetch Quidax market data
    const response = await fetch(`${QUIDAX_API_URL}/markets/tickers`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
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
    if (!data.data) {
      throw new Error('Invalid response format from Quidax API');
    }

    let totalMarketCap = 0;
    let totalVolume = 0;
    let btcMarketCap = 0;

    // Calculate totals using Quidax data
    Object.entries(data.data).forEach(([market, details]: [string, any]) => {
      const ticker = details.ticker;
      if (!ticker) return;

      const price = parseFloat(ticker.last);
      const volume = parseFloat(ticker.vol);
      
      // Market cap calculation (price * circulating supply estimate)
      // Since we don't have circulating supply, we'll use a proxy based on market type
      let estimatedSupply = 0;
      if (market.includes('btc')) {
        estimatedSupply = 19500000; // Approximate BTC supply
      } else if (market.includes('eth')) {
        estimatedSupply = 120000000; // Approximate ETH supply
      } else if (market.includes('usdt') || market.includes('usdc')) {
        estimatedSupply = 80000000000; // Approximate stablecoin supply
      } else {
        estimatedSupply = volume * 100; // Rough estimate for other tokens
      }

      const marketCap = price * estimatedSupply;
      const volumeInUSD = volume * price;

      if (market.includes('btc')) {
        btcMarketCap = marketCap;
      }

      totalMarketCap += marketCap;
      totalVolume += volumeInUSD;
    });

    const btcDominance = totalMarketCap > 0 ? (btcMarketCap / totalMarketCap) * 100 : 0;

    return NextResponse.json({
      status: 'success',
      data: {
        totalMarketCap: totalMarketCap.toFixed(2),
        tradingVolume24h: totalVolume.toFixed(2),
        btcDominance: btcDominance.toFixed(1),
        lastUpdated: new Date().toLocaleTimeString()
      }
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market overview' },
      { status: 500 }
    );
  }
} 