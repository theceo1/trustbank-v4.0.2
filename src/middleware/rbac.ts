import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { getUserRole, getRoutePermissions, hasAnyPermission } from '@/lib/rbac';

export async function rbacMiddleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() });
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role
    const userRole = await getUserRole(session.user.id);
    
    // Get required permissions for the route
    const requiredPermissions = getRoutePermissions(request.nextUrl.pathname);
    
    // If route requires permissions
    if (requiredPermissions.length > 0) {
      // Check if user has required permissions
      const hasPermission = hasAnyPermission(userRole, requiredPermissions);
      
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Add role to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', userRole);

    // Continue with the request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('RBAC error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 