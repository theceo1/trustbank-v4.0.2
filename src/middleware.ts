import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authenticator } from 'otplib'
import { adminMiddleware } from './middleware/admin'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 1 minute
const API_RATE_LIMIT = 1000; // Increased to 1000 requests per minute
const AUTH_RATE_LIMIT = 5; // 5 login attempts per minute
const MARKET_RATE_LIMIT = 1500; // Higher limit for market endpoints

async function checkRateLimit(ip: string, path: string): Promise<boolean> {
  // Skip rate limiting for health checks
  if (path === '/api/health') {
    return true;
  }

  const isMarketEndpoint = path.startsWith('/api/markets/');
  const isAuth = path.startsWith('/api/auth');
  const limit = isAuth ? AUTH_RATE_LIMIT : isMarketEndpoint ? MARKET_RATE_LIMIT : API_RATE_LIMIT;
  
  const key = `rate_limit:${ip}:${path}`;

  try {
    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, RATE_LIMIT_WINDOW);
    const [current] = await multi.exec();
    
    return (current as number) <= limit;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Allow request if Redis fails
  }
}

// Routes that require 2FA
const PROTECTED_ROUTES = [
  // Wallet operations requiring 2FA
  '/api/wallet/withdraw',
  '/api/wallet/transfer',
  '/api/wallet/swap',
  
  // P2P trade operations requiring 2FA
  '/api/trades/p2p/trades',
  '/api/trades/p2p/orders',
  '/api/trades/p2p/create',
  '/api/trades/p2p/cancel',
  
  // Instant swap operations requiring 2FA
  '/api/trades/swap/confirm',
  '/api/trades/swap/execute'
];

// Routes that require authentication
const AUTH_REQUIRED_PATHS = [
  // App routes
  '/dashboard',
  '/profile',
  '/profile/wallet',      // Main wallet page
  '/profile/wallet/send', // Send crypto page
  '/profile/wallet/receive', // Receive crypto page
  '/profile/wallet/swap', // Swap page
  '/profile/wallet/history', // Transaction history
  
  // Trade routes
  '/trade',               // Main trade page
  '/trade/spot',         // Spot trading
  '/trade/spot/orders',  // Spot orders
  '/trade/spot/history', // Spot history
  '/trade/p2p',          // P2P trading
  '/trade/p2p/offers',   // P2P offers
  '/trade/p2p/orders',   // P2P orders
  '/trade/history',      // Trade history
  '/trade/guide',        // Trading guide
  
  // Settings and security
  '/settings',
  '/kyc',
  '/transactions',
  
  // Protected API routes
  '/api/wallet',         // All wallet endpoints
  '/api/trades',         // All trade endpoints
  '/api/trades/spot',    // Spot trading endpoints
  '/api/trades/p2p',     // P2P trading endpoints
  '/api/trades/history', // Trading history
  '/api/user',          // User data endpoints
  '/api/admin',         // Admin endpoints
  '/api/config',        // Protected config endpoints
];

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  // API routes
  '/api/auth/test-token',
  '/api/auth/callback',
  '/api/auth/sign-in',
  '/api/auth/signup',
  '/api/markets/overview',
  '/api/markets/tickers',
  '/api/markets/rate',
  '/api/markets/rates',
  '/api/markets/usdtngn/ticker',
  '/api/markets/usdtngn/order-book',
  '/api/config/fees',
  '/api/user/wallets',
  '/api/swap/quotation',
  
  // Home and Marketing
  '/',
  '/home',
  '/blog',
  '/features',
  '/pricing',
  '/contact',
  
  // Auth routes
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  
  // About pages
  '/about',
  '/about/vision',
  '/about/mission',
  '/about/team',
  '/about/careers',
  '/about/faq',
  '/about/contact',
  '/about/blog',
  
  // Legal pages
  '/legal',
  '/legal/terms',
  '/legal/privacy',
  '/legal/aml',
  '/legal/kyc',
  '/legal/risk',
  '/legal/cookies',
  
  // Tools and Market
  '/calculator',
  '/market'
];

// Define admin routes pattern
const ADMIN_ROUTES = /^\/admin(?:\/.*)?$/;

export async function middleware(req: NextRequest) {
  console.log('\n[MAIN MIDDLEWARE] ====== Request Start ======');
  console.log('[MAIN MIDDLEWARE] Path:', req.nextUrl.pathname);
  console.log('[MAIN MIDDLEWARE] Method:', req.method);
  console.log('[MAIN MIDDLEWARE] Cookies:', {
    names: req.cookies.getAll().map(c => c.name),
    hasAccessToken: !!req.cookies.get('sb-access-token'),
    hasSession: !!req.cookies.get('sb-session'),
    hasAdminSession: !!req.cookies.get('admin-session')
  });

  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  // Set the x-pathname header for all requests
  res.headers.set('x-pathname', path);

  // Check if the path is the admin login page FIRST
  if (path === '/admin/login') {
    console.log('[MAIN MIDDLEWARE] Admin login page detected, bypassing all checks');
    res.cookies.set('next-url', path);
    return res;
  }

  // Check if the path is an admin route
  const isAdminRoute = ADMIN_ROUTES.test(path) || path.startsWith('/api/admin');
  console.log('[MAIN MIDDLEWARE] Route check:', {
    path,
    isAdminRoute,
    isApiRoute: path.startsWith('/api/')
  });

  // For admin routes, delegate to admin middleware
  if (isAdminRoute) {
    console.log('[MAIN MIDDLEWARE] Delegating to admin middleware');
    try {
      const adminResponse = await adminMiddleware(req);
      if (adminResponse) {
        console.log('[MAIN MIDDLEWARE] Admin middleware returned response:', {
          status: adminResponse.status,
          location: adminResponse.headers.get('location'),
          type: adminResponse instanceof NextResponse ? 'NextResponse' : 'unknown'
        });
        return adminResponse;
      }
    } catch (error) {
      console.error('[MAIN MIDDLEWARE] Admin middleware error:', error);
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Then check if the path is public
  const isPublicPath = PUBLIC_PATHS.some(p => path.startsWith(p));
  console.log('[MAIN MIDDLEWARE] Public path check:', {
    path,
    isPublicPath,
    publicPaths: PUBLIC_PATHS
  });

  if (isPublicPath) {
    console.log('[MAIN MIDDLEWARE] Allowing public path access');
    return res;
  }

  const supabase = createMiddlewareClient({ req, res });

  try {
    console.log('[MAIN MIDDLEWARE] Checking session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('[MAIN MIDDLEWARE] Session check result:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      error: error?.message,
      accessToken: session?.access_token ? 'Present' : 'Missing',
      refreshToken: session?.refresh_token ? 'Present' : 'Missing'
    });

    if (error) {
      console.error('[MAIN MIDDLEWARE] Session error:', error);
      await supabase.auth.signOut();
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/auth/login';
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      console.log('[MAIN MIDDLEWARE] Redirecting to auth login due to session error');
      return NextResponse.redirect(redirectUrl);
    }

    // Check if route requires authentication
    const isAuthRequired = AUTH_REQUIRED_PATHS.some(route => path.startsWith(route));
    const isAuthRoute = path.startsWith('/auth');

    console.log('[MAIN MIDDLEWARE] Auth route check:', {
      path,
      isAuthRequired,
      isAuthRoute,
      hasSession: !!session,
      sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
    });

    if (isAuthRequired && !session) {
      console.log('[MAIN MIDDLEWARE] Protected route accessed without session, redirecting to login');
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/auth/login';
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (isAuthRoute && session) {
      console.log('[MAIN MIDDLEWARE] Auth route accessed with active session, redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Set session cookies for client-side access
    if (session) {
      console.log('[MAIN MIDDLEWARE] Setting session cookies');
      const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
      
      res.cookies.set('sb-access-token', session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: '/'
      });

      res.cookies.set('sb-refresh-token', session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: '/'
      });

      res.cookies.set('sb-session', JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: '/'
      });
    }

    console.log('[MAIN MIDDLEWARE] ====== Request End ======\n');
    return res;
  } catch (error) {
    console.error('[MAIN MIDDLEWARE] Unexpected error:', error);
    return res;
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 