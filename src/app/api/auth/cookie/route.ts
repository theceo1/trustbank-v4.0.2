import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database';

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute
const requestLog = new Map<string, { count: number; timestamp: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userRequests = requestLog.get(userId);

  if (!userRequests) {
    requestLog.set(userId, { count: 1, timestamp: now });
    return false;
  }

  if (now - userRequests.timestamp > RATE_LIMIT_WINDOW) {
    requestLog.set(userId, { count: 1, timestamp: now });
    return false;
  }

  if (userRequests.count >= MAX_REQUESTS) {
    return true;
  }

  userRequests.count++;
  return false;
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get the token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token and get user data
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);
    
    if (getUserError || !user) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401 }
      );
    }

    // Check rate limit
    if (isRateLimited(user.id)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429 }
      );
    }

    // Set the auth cookie
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // The refresh token should be handled by Supabase client
    });

    return new NextResponse(
      JSON.stringify({ message: 'Auth cookie set successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error setting auth cookie:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 