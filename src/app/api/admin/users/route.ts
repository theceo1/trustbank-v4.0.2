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
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build the query
    let query = supabase
      .from('user_profiles')
      .select(`
        *,
        roles:user_roles!user_profiles_user_id_fkey (
          role
        ),
        kyc_submissions (
          status,
          submitted_at,
          verified_at
        )
      `);

    // Apply filters
    if (role && role !== 'all') {
      query = query.eq('roles.role', role);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Execute the query
    const { data: users, error: usersError } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedUsers = users.map(user => ({
      id: user.user_id,
      email: user.email,
      name: user.full_name,
      role: user.roles?.role || 'user',
      status: user.status,
      lastLogin: user.last_login,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      metadata: {
        phone: user.phone,
        country: user.country,
        address: user.address
      },
      kyc: user.kyc_submissions?.[0] ? {
        status: user.kyc_submissions[0].status,
        submittedAt: user.kyc_submissions[0].submitted_at,
        verifiedAt: user.kyc_submissions[0].verified_at
      } : undefined
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