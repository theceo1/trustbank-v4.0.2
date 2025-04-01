import { NextResponse } from 'next/server';

const QUIDAX_API_URL = process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1';

export async function GET() {
  try {
    const response = await fetch(`${QUIDAX_API_URL}/markets/tickers`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Quidax API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch market tickers: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data?.data) {
      throw new Error('Invalid response from Quidax API');
    }

    return NextResponse.json({
      status: 'success',
      data: data.data
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