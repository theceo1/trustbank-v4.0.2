import { NextResponse } from 'next/server';
import { quidaxService } from '@/lib/quidax';

export async function GET() {
  try {
    const tickers = await quidaxService.getMarketTickers();
    
    return NextResponse.json({
      status: 'success',
      data: tickers
    });
  } catch (error) {
    console.error('Error fetching tickers:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to fetch tickers',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 