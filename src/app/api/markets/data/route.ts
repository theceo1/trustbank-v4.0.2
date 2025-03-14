import { NextResponse } from 'next/server';

const QUIDAX_API_URL = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
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

    // Fetch market data from Quidax
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

    // Transform data into expected format
    const marketData = Object.entries(data.data)
      .filter(([market]) => market.toLowerCase().endsWith('ngn'))
      .map(([market, details]: [string, any]) => {
        const ticker = details.ticker;
        if (!ticker) return null;

        // Calculate 24h change
        const last = parseFloat(ticker.last);
        const open = parseFloat(ticker.open);
        const change24h = ((last - open) / open) * 100;

        return {
          pair: market.toUpperCase(),
          lastPrice: ticker.last,
          change24h: parseFloat(change24h.toFixed(2)),
          high24h: ticker.high,
          low24h: ticker.low,
          volume24h: ticker.vol
        };
      })
      .filter(item => item !== null);

    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
} 