import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authenticator } from 'otplib'
import { adminMiddleware } from './middleware/admin'

// Routes that require 2FA
const PROTECTED_ROUTES = [
  '/api/wallet/withdraw',
  '/api/trades/p2p/trades',
  '/api/trades/p2p/orders'
];

// Routes that require authentication
const AUTH_REQUIRED_PATHS = [
  '/dashboard',
  '/profile',
  '/wallet',
  '/trades',
  '/settings',
  '/kyc',
  '/transactions'
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

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Handling request for path: ${request.nextUrl.pathname}`);
  
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Add CSP headers
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.supabase.co;
    font-src 'self';
    connect-src 'self' 
      https://*.supabase.co 
      wss://*.supabase.co 
      https://*.trustbank.tech
      https://trustbank.tech
      https://www.trustbank.tech
      wss://*.trustbank.tech
      https://api.quidax.com 
      https://api.dojah.io 
      https://ipinfo.io;
    frame-ancestors 'none';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim()

  // Set security headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)
  requestHeaders.set('X-Frame-Options', 'DENY')
  requestHeaders.set('X-Content-Type-Options', 'nosniff')
  requestHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  requestHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  const pathname = request.nextUrl.pathname

  // Always return for static files and public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.') ||
    pathname === '/' ||
    PUBLIC_PATHS.some(path => pathname.startsWith(path))
  ) {
    console.log(`[Middleware] Allowing public path: ${pathname}`);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Check if it's an admin route
  if (ADMIN_ROUTES.test(pathname)) {
    console.log(`[Middleware] Admin route detected: ${pathname}`);
    return adminMiddleware(request);
  }

  try {
    // For protected API routes
    if (pathname.startsWith('/api/')) {
      console.log(`[Middleware] API route detected: ${pathname}`);
      
      // Skip auth check for public API routes
      if (pathname.startsWith('/api/auth/')) {
        console.log(`[Middleware] Public API route detected: ${pathname}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      }

      const authHeader = request.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        console.log(`[Middleware] Missing or invalid Authorization header`);
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const token = authHeader.split(' ')[1]
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        )
      }

      // Check if the route requires 2FA
      if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        const { data: securitySettings, error: settingsError } = await supabase
          .from('security_settings')
          .select('two_factor_enabled, two_factor_secret')
          .eq('user_id', session.user.id)
          .single()

        if (settingsError || !securitySettings?.two_factor_enabled) {
          return NextResponse.json(
            { error: '2FA is required for this operation' },
            { status: 403 }
          )
        }

        // Get 2FA token from request headers
        const twoFactorToken = request.headers.get('x-2fa-token')
        if (!twoFactorToken) {
          return NextResponse.json(
            { error: '2FA token is required' },
            { status: 401 }
          )
        }

        // Verify 2FA token
        const isValid = authenticator.verify({
          token: twoFactorToken,
          secret: securitySettings.two_factor_secret,
        })

        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid 2FA token' },
            { status: 401 }
          )
        }
      }
    }

    // For protected routes that require authentication
    if (AUTH_REQUIRED_PATHS.some(path => pathname.startsWith(path))) {
      console.log(`[Middleware] Protected route detected: ${pathname}`);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.log(`[Middleware] No valid session found, redirecting to login`);
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/auth/login'
        redirectUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    console.log(`[Middleware] Allowing access to: ${pathname}`);
    // For all other routes, allow access with headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('[Middleware] Error:', error);
    // For API routes return JSON error
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
    // For other routes, redirect to login
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ]
} 