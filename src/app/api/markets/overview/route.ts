import { NextResponse } from 'next/server';
import { quidaxService } from '@/lib/quidax';

// Approximate circulating supplies as of 2024
const CIRCULATING_SUPPLIES = {
  BTC: 19_600_000, // ~19.6M BTC in circulation
  ETH: 120_000_000, // ~120M ETH in circulation
};

export async function GET() {
  try {
    const tickers = await quidaxService.getMarketTickers();
    
    let totalMarketCap = 0;
    let tradingVolume24h = 0;
    let btcMarketCap = 0;

    // Get USDT/NGN price for USD conversion
    const usdtNgnPrice = parseFloat(tickers['usdtngn']?.ticker?.last || '0');
    
    if (!usdtNgnPrice) {
      throw new Error('Unable to get USDT/NGN price for conversion');
    }

    // Calculate market caps and volumes
    Object.entries(tickers).forEach(([pair, data]) => {
      const price = parseFloat(data.ticker.last || '0');
      const volume = parseFloat(data.ticker.vol || '0');
      
      // Only process NGN pairs for now
      if (pair.endsWith('ngn')) {
        // Calculate trading volume in USD
        const volumeInNGN = price * volume;
        const volumeInUSD = volumeInNGN / usdtNgnPrice;
        tradingVolume24h += volumeInUSD;

        // Calculate market caps using circulating supply
        if (pair === 'btcngn') {
          const priceInUSD = price / usdtNgnPrice;
          btcMarketCap = priceInUSD * CIRCULATING_SUPPLIES.BTC;
          totalMarketCap += btcMarketCap;
        } else if (pair === 'ethngn') {
          const priceInUSD = price / usdtNgnPrice;
          const ethMarketCap = priceInUSD * CIRCULATING_SUPPLIES.ETH;
          totalMarketCap += ethMarketCap;
        }
      }
    });

    // Calculate BTC dominance
    const btcDominance = totalMarketCap > 0 ? (btcMarketCap / totalMarketCap) * 100 : 0;

    return NextResponse.json({
      status: 'success',
      data: {
        totalMarketCap,
        tradingVolume24h,
        btcDominance: parseFloat(btcDominance.toFixed(2)),
        lastUpdated: new Date().toISOString()
      }
    });
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