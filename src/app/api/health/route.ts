import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        redis: 'unknown',
        api: 'healthy',
      },
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      uptime: process.uptime(),
    };

    // Check database connection
    try {
      const { data, error } = await supabase.from('health_checks').select('id').limit(1);
      if (error) throw error;
      healthStatus.services.database = 'healthy';
    } catch (error) {
      healthStatus.services.database = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // Check Redis connection
    try {
      await redis.ping();
      healthStatus.services.redis = 'healthy';
    } catch (error) {
      healthStatus.services.redis = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // Return health status with appropriate status code
    return NextResponse.json(
      healthStatus,
      {
        status: healthStatus.status === 'healthy' ? 200 : 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
} 