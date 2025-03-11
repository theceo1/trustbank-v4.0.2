import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  console.log('🔄 Auth callback - Processing request');
  
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    console.log('📝 Auth code received, exchanging for session');
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Error exchanging code for session:', error);
        // Redirect to login with error
        const loginUrl = new URL('/auth/login', requestUrl.origin)
        loginUrl.searchParams.set('error', 'Authentication failed')
        return NextResponse.redirect(loginUrl)
      }

      console.log('✅ Session established for user:', data.user?.email);
    } catch (err) {
      console.error('❌ Unexpected error in auth callback:', err);
      // Redirect to login with error
      const loginUrl = new URL('/auth/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'Unexpected error occurred')
      return NextResponse.redirect(loginUrl)
    }
  } else {
    console.warn('⚠️ No auth code provided in callback');
  }

  console.log('➡️ Redirecting to dashboard');
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/app/dashboard', requestUrl.origin))
} 