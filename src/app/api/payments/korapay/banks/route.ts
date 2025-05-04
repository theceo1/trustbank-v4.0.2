import { NextResponse } from 'next/server';
import { korapayService } from '@/lib/services/korapay';

export async function GET() {
  try {
    const response = await korapayService.getBanks();

    return NextResponse.json({
      status: 'success',
      data: response.data.map((bank: any) => ({
        code: bank.code,
        name: bank.name,
        slug: bank.slug,
      })),
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch banks' },
      { status: 500 }
    );
  }
} 