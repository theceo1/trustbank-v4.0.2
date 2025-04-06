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

interface AuthUser {
  email: string;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  kyc_level: string | null;
  role: string | null;
  auth_user: AuthUser | null;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  user_profiles: UserProfile | null;
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
      const kycStatus = url.searchParams.get('kycStatus') || '';
      const sortBy = url.searchParams.get('sortBy') || 'created_at';
      const sortOrder = url.searchParams.get('sortOrder') || 'desc';

      console.log('[USERS API] Query params:', { page, pageSize, search, kycStatus, sortBy, sortOrder });

      // Calculate pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;

      // First get basic user count to verify access
      const { data: roleCheck, error: roleError } = await supabase
        .from('user_profiles')
        .select('role')
        .not('role', 'is', null);

      console.log('[USERS API] Available roles:', roleCheck?.map(r => r.role));

      // Get total count without role filter first
      const { count } = await supabase
        .from('user_profiles')
        .select('*', { 
          count: 'exact', 
          head: true 
        });

      console.log('[USERS API] Total profiles in database:', count);

      // Get paginated users with profiles
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          phone_number,
          kyc_level,
          role,
          auth_user:user_id (
            email,
            created_at,
            updated_at
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(startIndex, endIndex) as { data: UserProfile[] | null, error: any };

      if (error) {
        console.error('[USERS API] Error fetching users:', error);
        throw new Error('Failed to fetch users');
      }

      console.log('[USERS API] Raw users data:', users?.slice(0, 3));

      // Transform basic user data
      const transformedUsers = users?.map(profile => ({
        id: profile.user_id,
        email: profile.auth_user?.email || 'No Email',
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No Name',
        role: profile.role || 'user',
        lastLogin: profile.auth_user?.updated_at || profile.auth_user?.created_at || new Date().toISOString(),
        createdAt: profile.auth_user?.created_at || new Date().toISOString(),
        updatedAt: profile.auth_user?.updated_at || new Date().toISOString(),
        kycStatus: profile.kyc_level || 'pending'
      })) || [];

      console.log('[USERS API] First 3 users:', transformedUsers.slice(0, 3));

      return NextResponse.json({
        users: transformedUsers,
        stats: {
          totalUsers: count || 0,
          pendingUsers: transformedUsers.filter(u => u.kycStatus === 'pending').length
        },
        pagination: {
          total: count || 0,
          page,
          pageSize,
          totalPages: count ? Math.ceil(count / pageSize) : 1
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