import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
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
      .single();

    if (adminError || !adminData?.admin_roles) {
      return NextResponse.json({ isAdmin: false }, { status: 403 });
    }

    const role = adminData.admin_roles.name;
    const permissions = adminData.admin_roles.permissions;

    return NextResponse.json({
      isAdmin: ['admin', 'super_admin'].includes(role),
      role,
      permissions,
    });
  } catch (error) {
    console.error('Admin auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 