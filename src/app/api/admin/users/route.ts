import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Permission } from '@/lib/rbac';
import { hasPermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view users
    const hasAccess = await hasPermission(session.user.id, Permission.VIEW_USERS);
    if (!hasAccess) {
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
        user_roles (
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
      query = query.eq('user_roles.role', role);
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
      role: user.user_roles?.role || 'user',
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