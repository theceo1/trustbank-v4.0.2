import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const apiRes = await fetch('https://www.quidax.com/api/v1/markets/tickers/usdtngn');
    if (!apiRes.ok) {
      return NextResponse.json({ status: 'error', error: 'Failed to fetch ticker' }, { status: apiRes.status });
    }
    const data = await apiRes.json();
    // Adapt to your frontend expectations
    return NextResponse.json({ status: 'success', data: { price: data.data.ticker.last } });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: 'Failed to fetch ticker' }, { status: 500 });
  }
}
