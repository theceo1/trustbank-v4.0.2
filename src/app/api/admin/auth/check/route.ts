import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface AdminRole {
  name: string;
  permissions: string[];
}

interface AdminData {
  admin_roles: AdminRole;
}

export async function GET() {
  try {
    const cookieStore = cookies();
    console.log('Available cookies:', cookieStore.getAll().map(c => c.name));

    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    console.log('Admin check: Session check result:', { 
      session: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        },
        expires_at: session.expires_at
      } : null, 
      error: sessionError 
    });

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role from admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        id,
        user_id,
        role_id,
        is_active,
        admin_roles (
          id,
          name,
          permissions
        )
      `)
      .eq('user_id', session.user.id)
      .single() as { data: AdminData | null, error: any };

    console.log('Admin check: Admin data:', adminData);
    console.log('Admin check: Admin error:', adminError);
    console.log('Admin check: Full query:', `SELECT * FROM admin_users WHERE user_id = '${session.user.id}'`);

    if (adminError || !adminData?.admin_roles) {
      return NextResponse.json({ error: 'Not an admin user' }, { status: 403 });
    }

    const role = adminData.admin_roles.name.toLowerCase();
    const permissions = adminData.admin_roles.permissions;

    console.log('Admin check: Role and permissions:', { role, permissions });

    // Check if user has admin or super_admin role
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid admin role' }, { status: 403 });
    }

    // Return success with role and permissions
    return NextResponse.json({
      success: true,
      role,
      permissions
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 