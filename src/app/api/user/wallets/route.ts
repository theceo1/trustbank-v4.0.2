import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { QuidaxService, QuidaxWallet } from '@/lib/quidax';

interface QuidaxResponse {
  status: string;
  message?: string;
  data: QuidaxWallet[];
}

export async function GET() {
  try {
    // Initialize Supabase client with proper cookie handling
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Quidax ID from profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.quidax_id) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Initialize Quidax service with secret key
    const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;
    if (!quidaxSecretKey) {
      throw new Error('QUIDAX_SECRET_KEY is not configured');
    }
    
    const quidaxService = new QuidaxService(quidaxSecretKey);

    // Fetch wallets from Quidax with error logging
    try {
      console.log('[UserWallets] Fetching wallets for user:', profile.quidax_id);
      const response = await quidaxService.getWallets(profile.quidax_id);
      console.log('[UserWallets] Raw response:', response);

      // Handle both wrapped and unwrapped responses
      const wallets = Array.isArray(response) ? response : 
                     Array.isArray((response as QuidaxResponse)?.data) ? (response as QuidaxResponse).data :
                     [];

      console.log('[UserWallets] Processed wallets:', wallets.length);

      return NextResponse.json({
        status: 'success',
        data: wallets
      });
    } catch (error: any) {
      console.error('[UserWallets] Error fetching wallets:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  } catch (error) {
    console.error('[UserWallets] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
} 