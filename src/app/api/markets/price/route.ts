import { NextResponse } from 'next/server';

const QUIDAX_API_URL = 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

export async function GET(request: Request) {
  try {
    if (!QUIDAX_SECRET_KEY) {
      console.error('QUIDAX_SECRET_KEY is not defined');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pair = searchParams.get('pair')?.toLowerCase() || 'btcngn';

    const response = await fetch(`${QUIDAX_API_URL}/markets/tickers/${pair}`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 5 }, // Cache for 5 seconds
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

    if (!data.data || !data.data.ticker) {
      throw new Error('Invalid response format from Quidax API');
    }

    // Calculate price change percentage
    const last = parseFloat(data.data.ticker.last);
    const open = parseFloat(data.data.ticker.open);
    const priceChangePercent = ((last - open) / open) * 100;

    return NextResponse.json({
      status: 'success',
      data: {
        pair: pair.toUpperCase(),
        price: data.data.ticker.last,
        priceChangePercent: priceChangePercent.toFixed(2),
        volume: data.data.ticker.vol,
        lastUpdated: new Date().toLocaleTimeString()
      }
    });
  } catch (error) {
    console.error('Error fetching price data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    );
  }
} 