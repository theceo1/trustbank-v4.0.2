import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    
    // Generate QR code URI
    const appName = 'TrustBank';
    const accountName = user.email;
    const otpauth = authenticator.keyuri(accountName!, appName, secret);

    return NextResponse.json({
      success: true,
      secret,
      qrCode: otpauth,
    });
  } catch (error: any) {
    console.error('2FA Setup Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
} 