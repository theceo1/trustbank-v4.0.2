import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Define public routes that don't need auth
  const publicRoutes = ['/', '/market', '/calculator', '/about', '/legal', '/auth']
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
    // If user is signed in and tries to access auth pages, redirect to dashboard
    if (session && request.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/app/dashboard', request.url))
    }
    return res
  }

  // For API routes, check Authorization header
  if (isApiRoute) {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return res
  }

  // For all other routes (protected routes), check session
  if (!session) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Special handling for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.role || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/app/dashboard', request.url))
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