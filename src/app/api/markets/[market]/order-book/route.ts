import { NextResponse } from 'next/server';

const QUIDAX_API_URL = 'https://www.quidax.com/api/v1';

export async function GET(
  request: Request,
  { params }: { params: { market: string } }
) {
  try {
    const market = await params.market;
    const response = await fetch(`${QUIDAX_API_URL}/markets/${market}/order_book`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 5 }, // Cache for 5 seconds
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Market not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to fetch order book');
    }

    const data = await response.json();
    
    // Return the order book data directly in the expected format
    return NextResponse.json({
      asks: data.asks || [],
      bids: data.bids || []
    });
  } catch (error) {
    console.error('Error fetching order book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order book' },
      { status: 500 }
    );
  }
} 