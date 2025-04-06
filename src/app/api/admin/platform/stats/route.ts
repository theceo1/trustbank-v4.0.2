import { NextResponse } from 'next/server';
import { createQuidaxServer } from '@/lib/quidax';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
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
  sn: string;
  email: string | null;
  reference: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

interface QuidaxWallet {
  currency: string;
  balance: string;
  locked: string;
}

interface QuidaxResponse<T> {
  status: string;
  message: string;
  data: T;
}

interface RevenueStats {
  totalRevenue: number;
  quidaxFees: number;
  netRevenue: number;
  feeBreakdown: {
    tier1: number;  // 0-1K USD
    tier2: number;  // 1K-5K USD
    tier3: number;  // 5K-20K USD
    tier4: number;  // 20K-100K USD
    tier5: number;  // 100K+ USD
  };
}

interface PlatformStatsResponse {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  totalWallets: number;
  revenue: RevenueStats;
  userSegmentation: {
    tier1: number;  // Basic
    tier2: number;  // Starter
    tier3: number;  // Intermediate
    tier4: number;  // Advanced
    tier5: number;  // Premium
  };
  topWallets: Array<{
    currency: string;
    balance: string;
    converted_balance: string;
    name: string;
  }>;
}

// Volume-based fee tiers (in USD)
const VOLUME_TIERS = {
  TIER_1: { min: 0, max: 1000, fee: 4.0 },        // 0-1K USD: 4.0%
  TIER_2: { min: 1000, max: 5000, fee: 3.5 },     // 1K-5K USD: 3.5%
  TIER_3: { min: 5000, max: 20000, fee: 3.0 },    // 5K-20K USD: 3.0%
  TIER_4: { min: 20000, max: 100000, fee: 2.8 },  // 20K-100K USD: 2.8%
  TIER_5: { min: 100000, max: Infinity, fee: 2.5 } // 100K+ USD: 2.5%
};

const QUIDAX_FEE = 0.014; // 1.4%

function getUserFeeRate(volume: number): number {
  for (const tier of Object.values(VOLUME_TIERS)) {
    if (volume >= tier.min && volume < tier.max) {
      return tier.fee / 100; // Convert percentage to decimal
    }
  }
  return VOLUME_TIERS.TIER_5.fee / 100; // Default to lowest fee tier
}

export async function GET(): Promise<NextResponse> {
  try {
    console.log('[STATS] Initializing clients');
    const quidax = createQuidaxServer();
    const supabase = createServerComponentClient<Database>({ cookies });
    
    console.log('[STATS] Starting data fetch');
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('[STATS] Session error:', sessionError);
      return NextResponse.json({ 
        status: 'error',
        message: 'Unauthorized',
        error: sessionError?.message || 'No valid session'
      }, { status: 401 });
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
      console.error('[STATS] Admin verification error:', adminError);
      return NextResponse.json({ 
        status: 'error',
        message: 'Not an admin user',
        error: adminError?.message || 'Invalid admin data'
      }, { status: 403 });
    }

    const role = adminData.admin_roles.name.toLowerCase();
    if (!['admin', 'super_admin'].includes(role)) {
      console.error('[STATS] Invalid role:', role);
      return NextResponse.json({ 
        status: 'error',
        message: 'Invalid admin role',
        error: `Role ${role} not authorized`
      }, { status: 403 });
    }

    // Fetch data in parallel
    console.log('[STATS] Fetching user profiles and transactions');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      { data: userProfiles, error: userError },
      { data: transactions, error: txError }
    ] = await Promise.all([
      supabase.from('user_profiles').select('*'),
      supabase.from('transactions')
        .select('*')
        .or('status.eq.completed,status.eq.pending,status.eq.processing')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
    ]);

    if (userError) {
      console.error('[STATS] User profiles error:', userError);
      throw new Error(`Failed to fetch users: ${userError.message}`);
    }
    if (txError) {
      console.error('[STATS] Transactions error:', txError);
      throw new Error(`Failed to fetch transactions: ${txError.message}`);
    }

    // Fetch Quidax data with detailed logging
    console.log('[STATS] Fetching Quidax parent account');
    let parentAccountResponse;
    try {
      parentAccountResponse = await quidax.request('/users/me');
      console.log('[STATS] Parent account raw response:', JSON.stringify(parentAccountResponse, null, 2));
    } catch (error: any) {
      console.error('[STATS] Quidax parent account error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to fetch Quidax parent account: ${error.message}`);
    }

    if (!parentAccountResponse || typeof parentAccountResponse !== 'object') {
      console.error('[STATS] Invalid Quidax response format:', parentAccountResponse);
      throw new Error('Invalid response format from Quidax API');
    }

    // Handle both wrapped and unwrapped responses
    const userData = 'data' in parentAccountResponse 
      ? (parentAccountResponse as QuidaxResponse<QuidaxUser>).data
      : parentAccountResponse as QuidaxUser;
    
    if (!userData || !userData.id) {
      console.error('[STATS] Invalid parent account data:', userData);
      throw new Error('Invalid parent account data from Quidax API');
    }

    console.log('[STATS] Parent account processed:', {
      id: userData.id,
      sn: userData.sn,
      email: userData.email
    });

    // Fetch wallets with detailed logging
    console.log('[STATS] Fetching parent account wallets');
    let walletsResponse;
    try {
      walletsResponse = await quidax.request('/users/me/wallets');
      console.log('[STATS] Wallets raw response:', JSON.stringify(walletsResponse, null, 2));
    } catch (error: any) {
      console.error('[STATS] Quidax wallets error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to fetch Quidax wallets: ${error.message}`);
    }

    if (!walletsResponse || typeof walletsResponse !== 'object') {
      console.error('[STATS] Invalid wallets response format:', walletsResponse);
      throw new Error('Invalid wallets response format from Quidax API');
    }

    // Handle both wrapped and unwrapped responses for wallets
    const walletData = Array.isArray(walletsResponse) 
      ? walletsResponse 
      : (walletsResponse as QuidaxResponse<QuidaxWallet[]>).data;
    
    if (!Array.isArray(walletData)) {
      console.error('[STATS] Invalid wallets data:', walletsResponse);
      throw new Error('Invalid wallets data from Quidax API');
    }

    console.log('[STATS] Wallets processed:', {
      count: walletData.length,
      currencies: walletData.map(w => w.currency)
    });

    // Calculate user segmentation based on KYC tier
    const userSegmentation = {
      tier1: userProfiles?.filter(user => user.kyc_level === 'TIER_1' || user.kyc_level === 'basic').length || 0,
      tier2: userProfiles?.filter(user => user.kyc_level === 'TIER_2' || user.kyc_level === 'starter').length || 0,
      tier3: userProfiles?.filter(user => user.kyc_level === 'TIER_3' || user.kyc_level === 'intermediate').length || 0,
      tier4: userProfiles?.filter(user => user.kyc_level === 'TIER_4' || user.kyc_level === 'advanced').length || 0,
      tier5: userProfiles?.filter(user => user.kyc_level === 'TIER_5' || user.kyc_level === 'premium').length || 0
    };

    // Update active user definition - active if they have transactions in last 30 days
    const activeUserIds = new Set(transactions?.map(tx => tx.user_id) || []);
    const activeUsers = userProfiles?.filter(user => activeUserIds.has(user.user_id)) || [];

    // Calculate user's 30-day trading volume
    const userVolumes = new Map<string, number>();
    const recentTransactions = transactions?.filter(tx => {
      const txDate = new Date(tx.created_at || '');
      return txDate >= thirtyDaysAgo;
    }) || [];

    // Calculate volume per user
    recentTransactions.forEach(tx => {
      userVolumes.set(tx.user_id, (userVolumes.get(tx.user_id) || 0) + tx.amount);
    });

    // Calculate revenue and fees based on transaction volume tiers
    const revenueStats = recentTransactions.reduce((acc, tx) => {
      const volume = tx.amount;
      const quidaxFee = volume * QUIDAX_FEE;
      const userFeeRate = getUserFeeRate(volume);
      const txRevenue = volume * userFeeRate;
      
      // Determine which tier this transaction falls into based on volume
      let tierRevenue = {
        tier1: 0, // 0-1K USD
        tier2: 0, // 1K-5K USD
        tier3: 0, // 5K-20K USD
        tier4: 0, // 20K-100K USD
        tier5: 0  // 100K+ USD
      };

      if (volume < 1000) {
        tierRevenue.tier1 = txRevenue;
      } else if (volume < 5000) {
        tierRevenue.tier2 = txRevenue;
      } else if (volume < 20000) {
        tierRevenue.tier3 = txRevenue;
      } else if (volume < 100000) {
        tierRevenue.tier4 = txRevenue;
      } else {
        tierRevenue.tier5 = txRevenue;
      }
      
      return {
        totalRevenue: acc.totalRevenue + txRevenue,
        quidaxFees: acc.quidaxFees + quidaxFee,
        netRevenue: acc.netRevenue + (txRevenue - quidaxFee),
        feeBreakdown: {
          tier1: acc.feeBreakdown.tier1 + tierRevenue.tier1,
          tier2: acc.feeBreakdown.tier2 + tierRevenue.tier2,
          tier3: acc.feeBreakdown.tier3 + tierRevenue.tier3,
          tier4: acc.feeBreakdown.tier4 + tierRevenue.tier4,
          tier5: acc.feeBreakdown.tier5 + tierRevenue.tier5
        }
      };
    }, {
      totalRevenue: 0,
      quidaxFees: 0,
      netRevenue: 0,
      feeBreakdown: { tier1: 0, tier2: 0, tier3: 0, tier4: 0, tier5: 0 }
    });

    // Process data with proper typing
    const stats: PlatformStatsResponse = {
      totalUsers: userProfiles?.length || 0,
      activeUsers: activeUsers.length,
      totalTransactions: recentTransactions.length,
      totalVolume: recentTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      totalWallets: walletData.length,
      revenue: revenueStats,
      userSegmentation,
      topWallets: walletData
        .filter(w => parseFloat(w.balance) > 0)
        .sort((a, b) => parseFloat(b.converted_balance) - parseFloat(a.converted_balance))
        .slice(0, 5)
        .map(w => ({
          currency: w.currency,
          balance: w.balance,
          converted_balance: w.converted_balance,
          name: w.name
        }))
    };

    console.log('[STATS] Final stats:', {
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      totalTransactions: stats.totalTransactions,
      totalVolume: stats.totalVolume,
      totalWallets: stats.totalWallets,
      revenue: {
        total: stats.revenue.totalRevenue,
        net: stats.revenue.netRevenue,
        quidaxFees: stats.revenue.quidaxFees
      },
      userSegmentation: stats.userSegmentation
    });

    // Return properly formatted response
    return NextResponse.json({
      status: 'success',
      message: 'Platform stats retrieved',
      data: stats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[STATS] Endpoint error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message || 'Internal server error',
        data: null,
        error: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        }
      },
      { status: error.response?.status || 500 }
    );
  }
}