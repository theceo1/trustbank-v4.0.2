import { NextResponse } from 'next/server';
import { quidaxService } from '@/lib/quidax';

export async function GET() {
  try {
    const response = await quidaxService.getMarketTickers();
    
    if (!response?.data) {
      throw new Error('Invalid response from Quidax API');
    }

    return NextResponse.json({
      status: 'success',
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching market tickers:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch market data'
      },
      { status: 500 }
    );
  }
} 