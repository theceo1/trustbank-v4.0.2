import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a new ratelimiter that allows 3 verification attempts per hour per user
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  prefix: 'kyc_verification',
});

// Define routes that need rate limiting
const RATE_LIMITED_ROUTES = [
  '/api/kyc/verify/nin',
  '/api/kyc/verify/bvn',
  '/api/kyc/verify/photoid',
];

// Helper function to get client IP
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return '127.0.0.1';
}

export async function middleware(request: NextRequest) {
  // Check if the route should be rate limited
  const shouldRateLimit = RATE_LIMITED_ROUTES.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (!shouldRateLimit) {
    return NextResponse.next();
  }

  try {
    // Get user identifier (IP if not authenticated)
    const identifier = request.headers.get('x-user-id') || getClientIp(request);
    
    const { success, limit, reset, remaining } = await ratelimit.limit(
      `kyc_${identifier}`
    );

    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many verification attempts. Please try again later.',
          resetIn: Math.ceil((reset - Date.now()) / 1000 / 60), // minutes
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const response = NextResponse.next();

    // Add rate limit headers to all responses
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', reset.toString());

    return response;
  } catch (error) {
    console.error('KYC Rate Limit Error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/api/kyc/verify/:path*',
  ],
}; 