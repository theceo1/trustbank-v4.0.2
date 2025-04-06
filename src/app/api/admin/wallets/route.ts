import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createQuidaxServer, QuidaxWallet, SubAccount } from '@/lib/quidax';
import { Permission } from '@/lib/rbac';

interface AdminRole {
  name: string;
  permissions: Permission[];
}

interface AdminData {
  admin_roles: AdminRole;
}

interface QuidaxUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface TransformedWallet {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currency: string;
  balance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastTransaction?: string;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;

    if (!quidaxSecretKey) {
      console.error('QUIDAX_SECRET_KEY not configured');
      return NextResponse.json({ 
        error: 'Service configuration error',
        details: 'Missing API key'
      }, { status: 500 });
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role from admin_users table
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

    if (adminError || !adminData?.admin_roles) {
      return NextResponse.json({ error: 'Not an admin user' }, { status: 403 });
    }

    const role = adminData.admin_roles.name.toLowerCase();

    // Check if user has admin or super_admin role
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid admin role' }, { status: 403 });
    }

    // Initialize Quidax service
    const quidax = createQuidaxServer(quidaxSecretKey);

    try {
      // Fetch platform wallets using 'me' as the user ID
      console.log('[WALLETS API] Fetching platform wallets');
      const wallets = await quidax.getWallets('me');
      
      return NextResponse.json({
        success: true,
        wallets,
      });

    } catch (error) {
      console.error('Error in wallets API:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch wallet data',
          details: error instanceof Error ? error.message : 'Unknown error',
          suggestion: 'Please try again later or contact support if the issue persists'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;

    if (!quidaxSecretKey) {
      return NextResponse.json({ 
        error: 'Service configuration error',
        details: 'Missing API key'
      }, { status: 500 });
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin permissions
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

    if (adminError || !adminData?.admin_roles) {
      return NextResponse.json({ error: 'Not an admin user' }, { status: 403 });
    }

    const role = adminData.admin_roles.name.toLowerCase();
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid admin role' }, { status: 403 });
    }

    // Get transfer details from request body
    const body = await req.json();
    const { currency, amount, fromType, toType, note } = body;

    if (!currency || !amount || !fromType || !toType) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'Currency, amount, fromType, and toType are required'
      }, { status: 400 });
    }

    // Initialize Quidax service
    const quidax = createQuidaxServer(quidaxSecretKey);

    try {
      // Perform the transfer using internal withdraw
      const response = await quidax.request('/users/me/withdraws', {
        method: 'POST',
        data: {
          currency: currency.toLowerCase(),
          amount: amount.toString(),
          fund_uid: 'me', // Transfer to same account
          transaction_note: note || `Transfer from ${fromType} to ${toType} wallet`,
          narration: `${fromType} to ${toType} transfer`
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Transfer initiated successfully',
        data: response
      });

    } catch (error) {
      console.error('Transfer error:', error);
      return NextResponse.json({
        error: 'Transfer failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing transfer:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
} 