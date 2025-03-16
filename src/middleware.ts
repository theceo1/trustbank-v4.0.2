import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Create a response early
    const res = NextResponse.next()
    
    // Create the Supabase client with proper cookie handling
    const supabase = createMiddlewareClient({ 
      req: request,
      res,
    })

    // Refresh session if expired - required for Server Components
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    // Define public routes that don't need auth
    const publicRoutes = [
      '/',
      '/auth/login',
      '/auth/signup',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/about',
      '/about/vision',
      '/about/mission',
      '/about/team',
      '/about/careers',
      '/about/faq',
      '/about/contact',
      '/about/blog',
      '/legal',
      '/legal/terms',
      '/legal/privacy',
      '/legal/aml',
      '/legal/kyc',
      '/legal/risk',
      '/legal/cookies',
      '/calculator',
      '/market',
      '/learn',
      '/status',
      '/support',
      '/features',
    ]
    
    const publicApiRoutes = [
      '/api/auth/login',
      '/api/auth/signup',
      '/api/markets/price',
      '/api/markets/overview',
      '/api/markets/tickers',
      '/api/markets/data',
      '/api/config/fees'
    ]
    
    // Check if the current path matches any public route
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname === route || 
      (route !== '/' && request.nextUrl.pathname.startsWith(route))
    )
    
    const isPublicApiRoute = publicApiRoutes.some(route =>
      request.nextUrl.pathname === route
    )

    const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

    // If it's a public route, allow access without authentication
    if (isPublicRoute || isPublicApiRoute) {
      return res
    }

    // For API routes, check Authorization header or session
    if (isApiRoute) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (!error && user) {
          return res
        }
      }
      
      // If no valid token in header, check for session
      if (session) {
        return res
      }
      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For all other routes (protected routes), check session
    if (!session) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user has a profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    // If no profile exists and not already on onboarding page, redirect to onboarding
    if (!profile && !request.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Check KYC status for trade pages
    const tradePages = ['/trade', '/trade/spot', '/trade/p2p'];
    if (tradePages.some(page => request.nextUrl.pathname.startsWith(page))) {
      // Check if user has completed at least basic KYC
      const verificationHistory = profile?.verification_history || {};
      const hasBasicKyc = verificationHistory.email && 
                         verificationHistory.phone && 
                         verificationHistory.basic_info;

      if (!hasBasicKyc) {
        return NextResponse.redirect(new URL('/kyc?redirect=' + request.nextUrl.pathname, request.url));
      }
    }

    // Special handling for admin routes
    if (isAdminRoute) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (!userProfile?.role || userProfile.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return res
  } catch (e) {
    console.error('Middleware error:', e)
    // If there's an error, return the original response
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 