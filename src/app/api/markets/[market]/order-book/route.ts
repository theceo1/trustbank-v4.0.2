import { NextRequest, NextResponse } from 'next/server';

const QUIDAX_API_URL = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

// Debug log
console.log('API URL:', QUIDAX_API_URL);
console.log('Secret key loaded:', !!QUIDAX_SECRET_KEY);

// Validate market parameter
function isValidMarket(market: string): boolean {
  const validMarkets = [
    'qdxusdt', 'btcusdt', 'btcngn', 'ethngn', 'qdxngn', 'xrpngn', 
    'dashngn', 'ltcngn', 'usdtngn', 'btcghs', 'usdtghs', 'trxngn', 
    'dogeusdt', 'bnbusdt', 'maticusdt', 'safemoonusdt', 'aaveusdt', 
    'shibusdt', 'dotusdt', 'linkusdt', 'cakeusdt', 'xlmusdt', 'xrpusdt', 
    'ltcusdt', 'ethusdt', 'trxusdt', 'axsusdt', 'wsgusdt', 'afenusdt', 
    'blsusdt', 'dashusdt'
  ];
  return validMarkets.includes(market.toLowerCase());
}

interface QuidaxOrder {
  id: string;
  side: string;
  ord_type: string;
  price: string;
  volume: string;
  state: string;
}

interface QuidaxOrderBookResponse {
  status: string;
  message: string;
  data: {
    asks: QuidaxOrder[];
    bids: QuidaxOrder[];
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { market: string } }
) {
  if (!QUIDAX_SECRET_KEY) {
    console.error('QUIDAX_SECRET_KEY is not configured');
    return NextResponse.json(
      { error: 'API configuration error' },
      { status: 500 }
    );
  }

  const marketLower = params.market.toLowerCase();

  if (!isValidMarket(marketLower)) {
    return NextResponse.json(
      { error: 'Invalid market pair' },
      { status: 400 }
    );
  }

  try {
    // Add query parameters for limiting the number of orders
    const url = new URL(`${QUIDAX_API_URL}/markets/${marketLower}/order_book`);
    url.searchParams.append('ask_limit', '20');
    url.searchParams.append('bids_limit', '20');

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store', // Disable caching for real-time data
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Quidax API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to fetch order book data' },
        { status: response.status }
      );
    }

    const data = await response.json() as QuidaxOrderBookResponse;

    // Transform the data into the format expected by the OrderBook component
    const transformedData = {
      asks: data.data.asks
        .filter(order => order.state === 'wait')
        .map(order => ({
          price: order.price,
          volume: order.volume,
        })),
      bids: data.data.bids
        .filter(order => order.state === 'wait')
        .map(order => ({
          price: order.price,
          volume: order.volume,
        })),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching order book:', error);
    return NextResponse.json(
      { error: 'Failed to process order book data' },
      { status: 500 }
    );
  }
} 