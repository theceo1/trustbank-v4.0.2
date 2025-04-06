import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { Permission } from '@/lib/rbac';

interface AdminRole {
  id: string;
  name: string;
  permissions: Permission[];
}

interface AdminData {
  id: string;
  user_id: string;
  role_id: string;
  is_active: boolean;
  admin_roles: AdminRole;
}

export async function adminMiddleware(request: NextRequest) {
  console.log('\n[ADMIN MIDDLEWARE] ====== Start ======');
  console.log('[ADMIN MIDDLEWARE] Path:', request.nextUrl.pathname);
  console.log('[ADMIN MIDDLEWARE] Method:', request.method);
  console.log('[ADMIN MIDDLEWARE] Cookies:', {
    names: request.cookies.getAll().map(c => c.name),
    hasAccessToken: !!request.cookies.get('sb-access-token'),
    hasSession: !!request.cookies.get('sb-session'),
    hasAdminSession: !!request.cookies.get('admin-session')
  });
  
  try {
    // Create a response early to modify headers and cookies
    const res = NextResponse.next();

    // Skip middleware for admin login page
    if (request.nextUrl.pathname === '/admin/login') {
      console.log('[ADMIN MIDDLEWARE] Admin login page detected, skipping middleware');
      return null;
    }

    console.log('[ADMIN MIDDLEWARE] Initializing Supabase client');
    const supabase = createMiddlewareClient({ req: request, res });

    // Get current session with timeout
    console.log('[ADMIN MIDDLEWARE] Checking session');
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Session check timed out')), 10000)
    );

    type SessionResult = Awaited<ReturnType<typeof supabase.auth.getSession>>;
    const { data: { session }, error: sessionError } = await Promise.race([
      sessionPromise,
      timeoutPromise,
    ]).catch(error => {
      console.error('[ADMIN MIDDLEWARE] Session check error:', error);
      return { data: { session: null }, error } as SessionResult;
    });
    
    console.log('[ADMIN MIDDLEWARE] Session check result:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      accessToken: session?.access_token ? 'Present' : 'Missing',
      refreshToken: session?.refresh_token ? 'Present' : 'Missing',
      error: sessionError?.message,
      path: request.nextUrl.pathname
    });

    if (sessionError || !session) {
      console.log('[ADMIN MIDDLEWARE] No valid session, redirecting to admin login');
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      return NextResponse.redirect(redirectUrl);
    }

    // Get user's role from admin_users table with timeout
    console.log('[ADMIN MIDDLEWARE] Checking admin status for user:', session.user.id);
    const adminCheckPromise = supabase
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
      .single();

    type AdminCheckResult = { data: AdminData | null, error: any };
    const { data: adminData, error: adminError } = await Promise.race([
      adminCheckPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Admin check timed out')), 10000)
      ),
    ]).catch(error => {
      console.error('[ADMIN MIDDLEWARE] Admin check error:', error);
      return { data: null, error } as AdminCheckResult;
    }) as AdminCheckResult;

    console.log('[ADMIN MIDDLEWARE] Admin check result:', {
      hasAdminData: !!adminData,
      adminError: adminError?.message,
      role: adminData?.admin_roles?.name,
      permissions: adminData?.admin_roles?.permissions?.length,
      isActive: adminData?.is_active,
      path: request.nextUrl.pathname
    });

    if (adminError || !adminData?.admin_roles) {
      console.log('[ADMIN MIDDLEWARE] Not an admin user, redirecting to admin login');
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      return NextResponse.redirect(redirectUrl);
    }

    const role = adminData.admin_roles.name.toLowerCase();
    const permissions = adminData.admin_roles.permissions;

    // If not admin/super_admin, redirect to admin login
    if (!['admin', 'super_admin'].includes(role)) {
      console.log('[ADMIN MIDDLEWARE] Invalid role, redirecting to admin login:', role);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      return NextResponse.redirect(redirectUrl);
    }

    // Check if the user has the required permissions for the route
    const path = request.nextUrl.pathname;
    const requiredPermissions = getRoutePermissions(path);
    
    console.log('[ADMIN MIDDLEWARE] Permission check:', {
      path,
      requiredPermissions,
      userPermissions: permissions,
      hasAllPermission: permissions.includes(Permission.ALL)
    });

    // If user has 'all' permission, they can access everything
    if (!permissions.includes(Permission.ALL) && 
        requiredPermissions.length > 0 && 
        !requiredPermissions.every(p => permissions.includes(p))) {
      console.log('[ADMIN MIDDLEWARE] Missing required permissions, redirecting to admin home');
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin';
      return NextResponse.redirect(redirectUrl);
    }

    console.log('[ADMIN MIDDLEWARE] Setting response headers and cookies');
    // Add role and permissions to request headers for downstream use
    res.headers.set('x-user-role', role);
    res.headers.set('x-user-permissions', JSON.stringify(permissions));
    res.headers.set('x-is-admin', 'true');

    // Set admin session cookies with longer expiration (30 days)
    const maxAge = 30 * 24 * 60 * 60;
    
    const adminSessionData = {
      role,
      permissions,
      userId: session.user.id
    };

    console.log('[ADMIN MIDDLEWARE] Setting admin session cookie:', adminSessionData);
    
    res.cookies.set('admin-session', JSON.stringify(adminSessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/admin'
    });

    console.log('[ADMIN MIDDLEWARE] Access granted for path:', request.nextUrl.pathname);
    console.log('[ADMIN MIDDLEWARE] ====== End ======\n');
    return res;

  } catch (error) {
    console.error('[ADMIN MIDDLEWARE] Unexpected error:', error);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    return NextResponse.redirect(redirectUrl);
  }
}

// Helper function to get required permissions for a route
function getRoutePermissions(path: string): Permission[] {
  // Base permissions for admin routes
  const adminRoutes: Record<string, Permission[]> = {
    '/admin': [Permission.VIEW_ADMIN_DASHBOARD],
    '/admin/users': [Permission.VIEW_USERS],
    '/admin/transactions': [Permission.VIEW_TRANSACTIONS],
    '/admin/wallets': [Permission.MANAGE_WALLET],
    '/admin/settings': [Permission.MANAGE_SETTINGS],
  };

  // Check exact matches first
  if (adminRoutes[path]) {
    return adminRoutes[path];
  }

  // Check API routes
  if (path.startsWith('/api/admin/')) {
    // Handle nested wallet routes
    if (path.startsWith('/api/admin/wallets/')) {
      return [Permission.MANAGE_WALLET];
    }
    
    // Handle other nested routes
    if (path.startsWith('/api/admin/users/')) {
      return [Permission.VIEW_USERS];
    }
    if (path.startsWith('/api/admin/transactions/')) {
      return [Permission.VIEW_TRANSACTIONS];
    }
    if (path.startsWith('/api/admin/settings/')) {
      return [Permission.MANAGE_SETTINGS];
    }
  }

  // Default to empty array if no match found
  return [];
} 