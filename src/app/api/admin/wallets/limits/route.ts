import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Permission } from '@/lib/rbac';

interface AdminRole {
  name: string;
  permissions: Permission[];
}

interface AdminData {
  admin_roles: AdminRole;
}

interface WalletLimit {
  currency: string;
  min_deposit: number;
  max_deposit: number;
  min_withdrawal: number;
  max_withdrawal: number;
  daily_limit: number;
  monthly_limit: number;
}

const QUIDAX_API_URL = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY!;

// Since Quidax doesn't provide a direct API for wallet limits,
// we'll store them in our database but use Quidax's supported currencies
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role and permissions
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        admin_roles (
          name,
          permissions
        )
      `)
      .eq('user_id', session.user.id)
      .single() as { data: AdminData | null, error: any };

    // Check if user is admin and has MANAGE_WALLET permission
    if (adminError || 
        !adminData?.admin_roles?.name || 
        !['admin', 'super_admin'].includes(adminData.admin_roles.name.toLowerCase()) ||
        (!adminData.admin_roles.permissions?.includes(Permission.ALL) && 
         !adminData.admin_roles.permissions?.includes(Permission.MANAGE_WALLET))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // First, fetch supported currencies from Quidax
    const walletsResponse = await fetch(`${QUIDAX_API_URL}/users/me/wallets`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!walletsResponse.ok) {
      throw new Error('Failed to fetch wallets from Quidax');
    }

    const walletsData = await walletsResponse.json();
    const supportedCurrencies = walletsData.data.map((wallet: any) => wallet.currency.toUpperCase());

    // Then fetch our stored limits for these currencies
    const { data: walletLimits, error: limitsError } = await supabase
      .from('wallet_limits')
      .select('*')
      .in('currency', supportedCurrencies)
      .order('currency');

    if (limitsError) {
      console.error('Error fetching wallet limits:', limitsError);
      return NextResponse.json(
        { error: 'Failed to fetch wallet limits' },
        { status: 500 }
      );
    }

    // Format the limits data
    const formattedLimits = (walletLimits || []).map((limit: WalletLimit) => ({
      currency: limit.currency.toUpperCase(),
      min_deposit: parseFloat(limit.min_deposit.toString()),
      max_deposit: parseFloat(limit.max_deposit.toString()),
      min_withdrawal: parseFloat(limit.min_withdrawal.toString()),
      max_withdrawal: parseFloat(limit.max_withdrawal.toString()),
      daily_limit: parseFloat(limit.daily_limit.toString()),
      monthly_limit: parseFloat(limit.monthly_limit.toString()),
    }));

    return NextResponse.json(formattedLimits);
  } catch (error) {
    console.error('Error in wallet limits endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role and permissions
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        admin_roles (
          name,
          permissions
        )
      `)
      .eq('user_id', session.user.id)
      .single() as { data: AdminData | null, error: any };

    // Check if user is admin and has MANAGE_WALLET permission
    if (adminError || 
        !adminData?.admin_roles?.name || 
        !['admin', 'super_admin'].includes(adminData.admin_roles.name.toLowerCase()) ||
        (!adminData.admin_roles.permissions?.includes(Permission.ALL) && 
         !adminData.admin_roles.permissions?.includes(Permission.MANAGE_WALLET))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the limit data from the request body
    const limitData = await request.json();

    // Validate the limit data
    if (!limitData.currency || 
        typeof limitData.min_deposit !== 'number' ||
        typeof limitData.max_deposit !== 'number' ||
        typeof limitData.min_withdrawal !== 'number' ||
        typeof limitData.max_withdrawal !== 'number' ||
        typeof limitData.daily_limit !== 'number' ||
        typeof limitData.monthly_limit !== 'number') {
      return NextResponse.json(
        { error: 'Invalid limit data provided' },
        { status: 400 }
      );
    }

    // First, verify this currency is supported by Quidax
    const walletsResponse = await fetch(`${QUIDAX_API_URL}/users/me/wallets`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!walletsResponse.ok) {
      throw new Error('Failed to fetch wallets from Quidax');
    }

    const walletsData = await walletsResponse.json();
    const supportedCurrencies = walletsData.data.map((wallet: any) => wallet.currency.toUpperCase());

    if (!supportedCurrencies.includes(limitData.currency.toUpperCase())) {
      return NextResponse.json(
        { error: 'Currency not supported by Quidax' },
        { status: 400 }
      );
    }

    // Update or insert the wallet limit
    const { data: updatedLimit, error: updateError } = await supabase
      .from('wallet_limits')
      .upsert({
        currency: limitData.currency.toUpperCase(),
        min_deposit: limitData.min_deposit,
        max_deposit: limitData.max_deposit,
        min_withdrawal: limitData.min_withdrawal,
        max_withdrawal: limitData.max_withdrawal,
        daily_limit: limitData.daily_limit,
        monthly_limit: limitData.monthly_limit,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (updateError) {
      console.error('Error updating wallet limit:', updateError);
      return NextResponse.json(
        { error: 'Failed to update wallet limit' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedLimit);
  } catch (error) {
    console.error('Error in wallet limits endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 