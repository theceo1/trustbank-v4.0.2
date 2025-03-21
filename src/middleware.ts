import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authenticator } from 'otplib'

// Routes that require 2FA
const PROTECTED_ROUTES = [
  '/api/wallet/withdraw',
  '/api/trades/p2p/trades',
  '/api/trades/p2p/orders'
];

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Public paths that don't require authentication
  const publicPaths = [
    '/api/auth/test-token',
    '/api/auth/callback',
    '/api/auth/sign-in',
    '/api/auth/sign-up',
    '/auth/login',
    '/auth/register',
    '/',
    '/about',
    '/contact'
  ]

  // Check if the current path is public
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return res
  }

  try {
    // For API routes, check Authorization header
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
      
      if (tokenError || !user) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      // Check if the route requires 2FA
      if (PROTECTED_ROUTES.some(route => request.nextUrl.pathname.startsWith(route))) {
        // Check if 2FA is enabled for the user
        const { data: securitySettings, error: settingsError } = await supabase
          .from('security_settings')
          .select('two_factor_enabled, two_factor_secret')
          .eq('user_id', user.id)
          .single();

        if (settingsError || !securitySettings?.two_factor_enabled) {
          return NextResponse.json(
            { error: '2FA is required for this operation' },
            { status: 403 }
          );
        }

        // Get 2FA token from request headers
        const twoFactorToken = request.headers.get('x-2fa-token');
        if (!twoFactorToken) {
          return NextResponse.json(
            { error: '2FA token is required' },
            { status: 401 }
          );
        }

        // Verify 2FA token
        const isValid = authenticator.verify({
          token: twoFactorToken,
          secret: securitySettings.two_factor_secret,
        });

        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid 2FA token' },
            { status: 401 }
          );
        }
      }
    } else {
      // For non-API routes, check session cookie
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/auth/login';
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    return res;
  } catch (error) {
    console.error('Auth error:', error);
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    } else {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/auth/login';
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 