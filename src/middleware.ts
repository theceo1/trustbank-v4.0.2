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
  '/api/auth/sign-up',
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
  const res = NextResponse.next()
  
  // Check rate limit
  const ip = req.ip || 'unknown';
  const path = req.nextUrl.pathname;
  
  if (path.startsWith('/api/')) {
    const allowed = await checkRateLimit(ip, path);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Please try again later'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': RATE_LIMIT_WINDOW.toString()
          }
        }
      );
    }
  }

  const supabase = createMiddlewareClient({ req, res })

  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.some(path => req.nextUrl.pathname.startsWith(path));
  if (isPublicPath) {
    return res;
  }

  try {
    // Refresh session if expired
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      // Clear any invalid session data
      await supabase.auth.signOut();
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/auth/login';
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if route requires authentication
    const isAuthRequired = AUTH_REQUIRED_PATHS.some(route => req.nextUrl.pathname.startsWith(route));
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth');

    if (isAuthRequired && !session) {
      // Redirect to login if accessing protected route without session
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/auth/login';
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (isAuthRoute && session) {
      // Redirect to dashboard if accessing auth routes with active session
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Set session cookie for client-side access
    if (session) {
      res.cookies.set('sb-access-token', session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
      });
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
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