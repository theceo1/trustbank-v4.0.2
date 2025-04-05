import { NextResponse } from 'next/server';

interface ChartData {
  date: string;
  transactions: number;
  volume: number;
  newUsers: number;
}

interface ChartsApiResponse {
  status: 'success' | 'error';
  chartData?: ChartData[];
  message?: string;
}

export async function GET(): Promise<NextResponse<ChartsApiResponse>> {
  try {
    // Generate realistic mock data
    const chartData: ChartData[] = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
      transactions: Math.floor(Math.random() * 10),
      volume: parseFloat((Math.random() * 100).toFixed(2)),
      newUsers: Math.floor(Math.random() * 3)
    }));

    return NextResponse.json({
      status: 'success',
      chartData
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to generate chart data'
      },
      { status: 500 }
    );
  }
}
