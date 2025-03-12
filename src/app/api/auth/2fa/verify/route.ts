import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
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

    const body = await request.json();
    const { code, secret } = body;

    if (!code || !secret) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex')
    );

    // Hash backup codes before storing
    const hashedBackupCodes = backupCodes.map((code) =>
      crypto.createHash('sha256').update(code).digest('hex')
    );

    // Store hashed backup codes in the database
    const { error: updateError } = await supabase
      .from('security_settings')
      .update({
        backup_codes: hashedBackupCodes,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      backupCodes,
    });
  } catch (error: any) {
    console.error('2FA Verification Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify 2FA code' },
      { status: 500 }
    );
  }
} 