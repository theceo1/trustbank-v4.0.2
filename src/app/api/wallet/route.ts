import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { QuidaxService } from '@/lib/quidax';
import type { Database } from '@/lib/database.types';

interface MarketData {
  currency: string;
  price: number;
  change_24h: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface UserProfile {
  quidax_id: string;
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with proper type assertion
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    const profile = profileData as UserProfile;
    if (!profile.quidax_id) {
      return NextResponse.json({ error: 'User has no Quidax ID' }, { status: 400 });
    }

    // Initialize Quidax service
    const quidax = new QuidaxService(
      process.env.NEXT_PUBLIC_QUIDAX_API_URL!,
      process.env.QUIDAX_SECRET_KEY!
    );

    // Fetch data in parallel for better performance
    const [walletsResponse, marketDataResponse, transactionsResponse] = await Promise.all([
      quidax.getWallets(profile.quidax_id),
      quidax.getOrderBook('btcngn'),
      quidax.getSwapTransactions(profile.quidax_id)
    ]);

    return NextResponse.json({
      wallets: walletsResponse?.data || [],
      marketData: marketDataResponse?.data || [],
      transactions: transactionsResponse?.data || [],
      userId: profile.quidax_id
    });

  } catch (error) {
    console.error('Error in wallet endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 