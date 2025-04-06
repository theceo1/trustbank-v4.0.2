import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface AdminRole {
  name: string;
  permissions: string[];
}

interface AdminData {
  admin_roles: AdminRole;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  kyc_level: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  user_profiles: UserProfile;
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

      // Build base query joining users and user_profiles
      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          created_at,
          updated_at,
          user_profiles!left (
            id,
            first_name,
            last_name,
            phone_number,
            kyc_level,
            role,
            created_at,
            updated_at
          )
        `, { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`email.ilike.%${search}%,user_profiles.first_name.ilike.%${search}%,user_profiles.last_name.ilike.%${search}%`);
      }

      if (kycStatus && kycStatus !== 'all') {
        query = query.eq('user_profiles.kyc_level', kycStatus);
      }

      // Apply sorting
      if (sortBy.startsWith('user_profiles.')) {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }

      // Apply pagination
      query = query.range(startIndex, endIndex);

      // Execute query
      console.log('[USERS API] Executing query');
      const { data: users, error: usersError, count } = await query as { 
        data: User[] | null, 
        error: any, 
        count: number | null 
      };

      console.log('[USERS API] Raw query results:', {
        usersCount: users?.length || 0,
        totalCount: count,
        error: usersError?.message
      });

      if (usersError) {
        console.error('[USERS API] Error fetching users:', usersError);
        throw new Error('Failed to fetch users');
      }

      if (!users) {
        console.log('[USERS API] No users found');
        return NextResponse.json({
          users: [],
          stats: {
            totalUsers: 0,
            activeUsers: 0,
            inactiveUsers: 0,
            pendingUsers: 0
          },
          pagination: {
            total: 0,
            page,
            pageSize,
            totalPages: 0
          }
        });
      }

      // Transform the data
      console.log('[USERS API] Transforming user data for:', users.length, 'users');
      const transformedUsers = users.map(user => {
        const transformed = {
          id: user.id,
          email: user.email,
          name: user.user_profiles ? `${user.user_profiles.first_name || ''} ${user.user_profiles.last_name || ''}`.trim() || 'No Name' : 'No Name',
          status: user.user_profiles?.kyc_level || 'pending',
          role: user.user_profiles?.role || 'user',
          lastLogin: user.updated_at,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          kycStatus: user.user_profiles?.kyc_level || 'pending',
          stats: {
            totalTransactions: 0,
            totalVolume: 0,
            successfulTransactions: 0,
            failedTransactions: 0
          }
        };
        console.log('[USERS API] Transformed user:', {
          id: transformed.id,
          email: transformed.email,
          status: transformed.status,
          kycStatus: transformed.kycStatus
        });
        return transformed;
      });

      // Calculate stats
      const stats = {
        totalUsers: count || 0,
        activeUsers: transformedUsers.filter(u => u.kycStatus !== 'pending').length,
        inactiveUsers: transformedUsers.filter(u => u.kycStatus === 'suspended').length,
        pendingUsers: transformedUsers.filter(u => u.kycStatus === 'pending').length
      };

      console.log('[USERS API] Final stats:', stats);
      console.log(`[USERS API] Returning ${transformedUsers.length} users with pagination:`, {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      });
      
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
      console.error('[USERS API] Error processing request:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  } catch (error) {
    console.error('[USERS API] Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}