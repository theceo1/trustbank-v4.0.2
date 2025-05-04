import { NextResponse } from 'next/server';
import { SUPPORTED_BANKS } from '@/lib/constants/banks';

export async function GET() {
  try {
    console.log('Returning local bank list...');
    
    if (!SUPPORTED_BANKS || SUPPORTED_BANKS.length === 0) {
      return NextResponse.json(
        { error: 'No banks available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      data: SUPPORTED_BANKS
    });
  } catch (error) {
    console.error('Error in banks API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 