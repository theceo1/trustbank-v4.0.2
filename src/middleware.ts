import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
    '/auth/register'
  ]

  // Check if the current path is public
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return res
  }

  try {
    // Refresh session if expired and valid refresh token exists
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) throw error

    if (!session) {
      // For API routes, return 401
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // For other routes, redirect to login
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 