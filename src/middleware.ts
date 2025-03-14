import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Define public routes that don't need auth
  const publicRoutes = ['/', '/market', '/calculator', '/about', '/legal', '/auth', '/learn']
  const publicApiRoutes = ['/api/auth/login']
  
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`)
  )
  
  const isPublicApiRoute = publicApiRoutes.some(route =>
    request.nextUrl.pathname === route
  )

  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  // If it's a public route or public API route, allow access
  if (isPublicRoute || isPublicApiRoute) {
    // If user is signed in and tries to access auth pages, redirect to trade
    if (session && request.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/trade', request.url))
    }
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

  // Special handling for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.role || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/trade', request.url))
    }
  }

  return res
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