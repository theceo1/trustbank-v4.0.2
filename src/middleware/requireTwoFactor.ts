import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { authenticator } from 'otplib';

// Routes that require 2FA
const PROTECTED_ROUTES = [
  '/api/wallet/withdraw',
  '/api/trades/p2p/orders',
  '/api/trades/p2p/trades',
];

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Check if the route requires 2FA
  const requiresTwoFactor = PROTECTED_ROUTES.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (!requiresTwoFactor) {
    return res;
  }

  try {
    // Get user session
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled for the user
    const { data: securitySettings, error: settingsError } = await supabase
      .from('security_settings')
      .select('two_factor_enabled, two_factor_secret')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !securitySettings?.two_factor_enabled) {
      return NextResponse.json(
        { success: false, error: '2FA is required for this operation' },
        { status: 403 }
      );
    }

    // Get 2FA token from request headers
    const twoFactorToken = request.headers.get('x-2fa-token');
    if (!twoFactorToken) {
      return NextResponse.json(
        { success: false, error: '2FA token is required' },
        { status: 401 }
      );
    }

    // Verify 2FA token
    const isValid = authenticator.verify({
      token: twoFactorToken,
      secret: securitySettings.two_factor_secret,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid 2FA token' },
        { status: 401 }
      );
    }

    return res;
  } catch (error) {
    console.error('2FA Middleware Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: [
    '/api/wallet/withdraw/:path*',
    '/api/trades/p2p/orders/:path*',
    '/api/trades/p2p/trades/:path*',
  ],
}; 