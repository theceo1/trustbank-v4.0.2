import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_DOJAH_API_URL}/api/v1/general/banks`, {
      headers: {
        'AppId': process.env.DOJAH_APP_ID!,
        'Authorization': process.env.DOJAH_API_KEY!,
      },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: false, error: 'Failed to fetch banks' }, { status: 500 });
  }
} 