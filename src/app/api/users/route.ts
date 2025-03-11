import { NextResponse } from 'next/server';
import { quidaxService } from '@/lib/quidax';

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    const quidaxUser = await quidaxService.createSubAccount(userData);
    
    return NextResponse.json({ data: quidaxUser });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
} 