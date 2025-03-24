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

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  // API routes
  '/api/auth/test-token',
  '/api/auth/callback',
  '/api/auth/sign-in',
  '/api/auth/sign-up',
  
  // Home
  '/',
  
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

export async function middleware(request: NextRequest) {
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

  // Check if the current path is public
  if (PUBLIC_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  try {
    // For API routes, check Authorization header
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
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

      // Verify token expiration
      const tokenExpiry = session.expires_at
      const currentTime = Math.floor(Date.now() / 1000)
      
      if (tokenExpiry && tokenExpiry < currentTime) {
        // Token has expired, try to refresh
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession()

        if (refreshError || !refreshedSession) {
          return NextResponse.json(
            { error: 'Session expired' },
            { status: 401 }
          )
        }
      }

      // Check if the route requires 2FA
      if (PROTECTED_ROUTES.some(route => request.nextUrl.pathname.startsWith(route))) {
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

      // Return response with headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } else {
      // For non-API routes, check session cookie
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/auth/login'
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Check token expiration
      const tokenExpiry = session.expires_at
      const currentTime = Math.floor(Date.now() / 1000)
      
      if (tokenExpiry && tokenExpiry < currentTime) {
        // Token has expired, try to refresh
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession()

        if (refreshError || !refreshedSession) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = '/auth/login'
          redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
          return NextResponse.redirect(redirectUrl)
        }
      }

      // Return response with headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  } catch (error) {
    console.error('Auth error:', error)
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    } else {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 