import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
    const secretKey = process.env.QUIDAX_SECRET_KEY;

    if (!secretKey) {
      console.error('QUIDAX_SECRET_KEY is not defined');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(`${apiUrl}/markets/tickers`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tickers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market tickers' },
      { status: 500 }
    );
  }
} 