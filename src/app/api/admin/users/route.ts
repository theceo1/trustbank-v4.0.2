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

interface UserProfile {
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  address: string | null;
}

interface DatabaseUser {
  id: string;
  email: string;
  user_metadata: any;
  created_at: string;
  last_sign_in_at: string | null;
  user_profiles: UserProfile | null;
}

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

    // Check if user is admin and has VIEW_USERS permission
    if (adminError || 
        !adminData?.admin_roles?.name || 
        !['admin', 'super_admin'].includes(adminData.admin_roles.name.toLowerCase()) ||
        (!adminData.admin_roles.permissions?.includes(Permission.ALL) && 
         !adminData.admin_roles.permissions?.includes(Permission.VIEW_USERS))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    // Build the query
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        user_metadata,
        created_at,
        last_sign_in_at,
        user_profiles (
          full_name,
          role,
          avatar_url,
          phone,
          country,
          address
        )
      `);

    // Apply filters
    if (role && role !== 'all') {
      query = query.eq('user_profiles.role', role);
    }
    if (search) {
      query = query.or(`email.ilike.%${search}%,user_profiles.full_name.ilike.%${search}%`);
    }

    // Execute the query
    const { data: users, error: usersError } = await query
      .order('created_at', { ascending: false })
      .limit(50) as { data: DatabaseUser[] | null, error: any };

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedUsers = (users || []).map(user => ({
      id: user.id,
      email: user.email,
      name: user.user_profiles?.full_name || 'Unknown',
      role: user.user_profiles?.role || 'user',
      status: 'active', // Default status since we don't have this in the database
      lastLogin: user.last_sign_in_at,
      avatarUrl: user.user_profiles?.avatar_url,
      createdAt: user.created_at,
      metadata: {
        phone: user.user_profiles?.phone,
        country: user.user_profiles?.country,
        address: user.user_profiles?.address
      }
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error in users endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}