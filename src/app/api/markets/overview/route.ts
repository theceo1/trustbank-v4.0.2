import { NextResponse } from 'next/server';
import { quidaxService } from '@/lib/quidax';

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
        const volumeInNGN = price * volume;
        const volumeInUSD = volumeInNGN / usdtNgnPrice;

        // Add to trading volume
        tradingVolume24h += volumeInUSD;

        // Calculate market cap for each asset
        if (pair === 'btcngn') {
          btcMarketCap = volumeInUSD;
          totalMarketCap += volumeInUSD;
        } else if (pair === 'ethngn') {
          totalMarketCap += volumeInUSD;
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