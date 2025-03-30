import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authenticator } from 'otplib'
import { adminMiddleware } from './middleware/admin'

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
  '/trade/p2p',          // P2P trading
  '/trade/p2p/offers',   // P2P offers
  '/trade/p2p/orders',   // P2P orders
  '/trade/swap',         // Instant swap
  '/trade/history',      // Trade history
  '/trade/guide',        // Trading guide
  
  // Settings and security
  '/settings',
  '/kyc',
  '/transactions',
  
  // Protected API routes
  '/api/wallet',         // All wallet endpoints
  '/api/trades',         // All trade endpoints
  '/api/user',          // User data endpoints
  '/api/admin',         // Admin endpoints
  '/api/config',        // Protected config endpoints
  '/api/swap',          // Swap endpoints
  
  // Specific trading API endpoints
  '/api/trades/p2p',    // P2P trading endpoints
  '/api/trades/swap',   // Swap endpoints
  '/api/trades/history' // Trading history
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
  const supabase = createMiddlewareClient({ req, res })

  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.some(path => req.nextUrl.pathname.startsWith(path));
  if (isPublicPath) {
    return res;
  }

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Check if route requires authentication
  const isAuthRequired = AUTH_REQUIRED_PATHS.some(route => req.nextUrl.pathname.startsWith(route))
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')

  if (isAuthRequired && !session) {
    // Redirect to login if accessing protected route without session
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && session) {
    // Redirect to dashboard if accessing auth routes with active session
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
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