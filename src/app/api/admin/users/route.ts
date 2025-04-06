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

interface UserProfileData {
  user_id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string;
  kyc_verified: boolean;
  kyc_level: string;
  completed_trades: number;
  trading_volume_usd: number;
  role: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  kyc_level: string;
  kyc_verified: boolean;
  trading_volume_usd: number;
  daily_volume_usd: number;
  monthly_volume_usd: number;
  completed_trades: number;
  quidax_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export async function GET(req: NextRequest) {
  try {
    console.log('[USERS API] Starting request');
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current session
    console.log('[USERS API] Checking session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('[USERS API] Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role from admin_users table
    console.log('[USERS API] Checking admin role');
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
      console.error('[USERS API] Admin verification error:', adminError);
      return NextResponse.json({ error: 'Not an admin user' }, { status: 403 });
    }

    const role = adminData.admin_roles.name.toLowerCase();
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid admin role' }, { status: 403 });
    }

    try {
      // Get query parameters
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
      const search = url.searchParams.get('search') || '';
      const status = url.searchParams.get('status') || '';
      const kycStatus = url.searchParams.get('kycStatus') || '';
      const sortBy = url.searchParams.get('sortBy') || 'created_at';
      const sortOrder = url.searchParams.get('sortOrder') || 'desc';

      console.log('[USERS API] Query params:', { page, pageSize, search, status, kycStatus, sortBy, sortOrder });

      // Calculate pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;

      // Build base query
      console.log('[USERS API] Building query');
      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          created_at,
          updated_at
        `, { count: 'exact' });

      // Fetch user profiles separately
      let profilesQuery = supabase
        .from('user_profiles')
        .select(`
          user_id,
          full_name,
          first_name,
          last_name,
          kyc_verified,
          kyc_level,
          completed_trades,
          trading_volume_usd,
          role
        `);

      // Apply filters
      if (search) {
        query = query.or(`email.ilike.%${search}%`);
        profilesQuery = profilesQuery.or(`full_name.ilike.%${search}%`);
      }

      if (status) {
        profilesQuery = profilesQuery.eq('status', status);
      }

      if (kycStatus) {
        profilesQuery = profilesQuery.eq('kyc_verified', kycStatus === 'verified');
      }

      // Apply sorting
      if (sortBy === 'created_at') {
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
      } else if (sortBy === 'last_sign_in_at') {
        query = query.order('last_sign_in_at', { ascending: sortOrder === 'asc', nullsFirst: false });
      }

      // Apply pagination
      query = query.range(startIndex, endIndex);

      // Execute queries
      console.log('[USERS API] Executing queries');
      const [{ data: users, error: usersError, count }, { data: profiles, error: profilesError }] = await Promise.all([
        query,
        profilesQuery
      ]);

      if (usersError || profilesError) {
        console.error('[USERS API] Error fetching users or profiles:', usersError || profilesError);
        throw new Error('Failed to fetch users or profiles');
      }

      if (!users) {
        console.log('[USERS API] No users found');
        return NextResponse.json({
          users: [],
          stats: {
            totalUsers: 0,
            activeUsers: 0,
            inactiveUsers: 0,
            pendingUsers: 0,
            totalTransactions: 0,
            totalVolume: 0,
            averageTransactionVolume: 0,
            kycCompletionRate: 0,
            userGrowth: 0
          },
          pagination: {
            total: 0,
            page,
            pageSize,
            totalPages: 0
          }
        });
      }

      console.log(`[USERS API] Found ${count || 0} total users`);

      // Transform the data
      const profilesMap = new Map(profiles.map((profile: any) => [profile.user_id, profile]));
      const transformedUsers = users.map((user: any) => {
        const profile = profilesMap.get(user.id) || {};
        return {
          id: user.id,
          email: user.email,
          name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'N/A',
          status: profile.status || 'pending',
          role: profile.role || 'user',
          lastLogin: user.created_at,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          stats: {
            totalTransactions: profile.completed_trades || 0,
            totalVolume: profile.trading_volume_usd || 0,
            successfulTransactions: profile.completed_trades || 0,
            failedTransactions: 0
          },
          kycStatus: profile.kyc_verified ? 'verified' : 'pending',
          verificationLevel: profile.kyc_level || 'level_0'
        };
      });

      // Calculate stats for the current filtered set
      const stats = {
        totalUsers: count || 0,
        activeUsers: transformedUsers.filter(u => u.status === 'active').length,
        inactiveUsers: transformedUsers.filter(u => u.status === 'inactive').length,
        pendingUsers: transformedUsers.filter(u => u.status === 'pending').length,
        totalTransactions: transformedUsers.reduce((acc, user) => acc + user.stats.totalTransactions, 0),
        totalVolume: transformedUsers.reduce((acc, user) => acc + user.stats.totalVolume, 0),
        averageTransactionVolume: transformedUsers.reduce((acc, user) => acc + user.stats.totalVolume, 0) / transformedUsers.length || 0,
        kycCompletionRate: (transformedUsers.filter(u => u.kycStatus === 'verified').length / transformedUsers.length) * 100 || 0,
        userGrowth: calculateUserGrowth(transformedUsers)
      };

      console.log('[USERS API] Successfully processed users data');
      return NextResponse.json({
        users: transformedUsers,
        stats,
        pagination: {
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      });

    } catch (error) {
      console.error('[USERS API] Error processing users:', error);
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[USERS API] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function calculateUserGrowth(users: any[]): number {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const recentUsers = users.filter(user => new Date(user.createdAt) > thirtyDaysAgo);
  const totalUsers = users.length;
  
  if (totalUsers === 0) return 0;
  return (recentUsers.length / totalUsers) * 100;
}