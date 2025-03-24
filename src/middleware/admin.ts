import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function adminMiddleware(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() });
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      // Redirect to login if no session
      return NextResponse.redirect(new URL('/auth/login', request.url));
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
      // User is not an admin, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }

    const role = adminData.admin_roles.name;
    const permissions = adminData.admin_roles.permissions;

    // Check if user has admin or super_admin role
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Add role and permissions to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', role);
    requestHeaders.set('x-user-permissions', JSON.stringify(permissions));

    // Continue with the request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Admin middleware error:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
} 