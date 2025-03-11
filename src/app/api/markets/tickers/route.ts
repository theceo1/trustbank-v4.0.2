import { NextResponse } from 'next/server';

const QUIDAX_API_URL = 'https://www.quidax.com/api/v1';

export async function GET() {
  try {
    const response = await fetch(`${QUIDAX_API_URL}/markets/tickers`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching market tickers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market rates' },
      { status: 500 }
    );
  }
} 