import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a new ratelimiter that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

// Define routes that need rate limiting
const RATE_LIMITED_ROUTES = [
  '/api/auth/2fa/verify',
  '/api/auth/2fa/setup',
  '/api/wallet/withdraw',
  '/api/trades/p2p/orders',
  '/api/trades/p2p/trades',
];

export async function middleware(request: NextRequest) {
  // Check if the route should be rate limited
  const shouldRateLimit = RATE_LIMITED_ROUTES.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (!shouldRateLimit) {
    return NextResponse.next();
  }

  const ip = request.ip ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ratelimit_${ip}`
  );

  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.floor((reset - Date.now()) / 1000).toString(),
      },
    });
  }

  const response = NextResponse.next();

  // Add rate limit headers to all responses
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());

  return response;
}

export const config = {
  matcher: [
    '/api/auth/2fa/:path*',
    '/api/wallet/withdraw/:path*',
    '/api/trades/p2p/:path*',
  ],
}; 