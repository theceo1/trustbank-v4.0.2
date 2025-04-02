import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const QUIDAX_API_URL = process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis client
const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL || '',
  token: UPSTASH_REDIS_REST_TOKEN || ''
});

const CACHE_KEY = 'market_tickers';
const CACHE_TTL = 60; // Increased to 60 seconds
const STALE_TTL = 600; // 10 minutes - keep stale data longer
const CIRCUIT_BREAKER_KEY = 'market_tickers_circuit';
const CIRCUIT_TTL = 300; // 5 minutes circuit breaker
const API_TIMEOUT = 5000; // Increased to 5 seconds
const MAX_RETRIES = 3;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function GET() {
  try {
    // Check circuit breaker first
    const isCircuitOpen = await redis.get(CIRCUIT_BREAKER_KEY);
    if (isCircuitOpen) {
      const staleData = await redis.get(`${CACHE_KEY}:stale`);
      if (staleData) {
        return NextResponse.json({
          status: 'success',
          data: staleData,
          source: 'stale_cache_circuit'
        });
      }
    }

    // Try to get from cache first
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      return NextResponse.json({
        status: 'success',
        data: cachedData,
        source: 'cache'
      });
    }

    // Implement retry logic with exponential backoff
    let lastError;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetchWithTimeout(`${QUIDAX_API_URL}/markets/tickers`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          next: { revalidate: CACHE_TTL }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch market tickers: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data?.data) {
          throw new Error('Invalid response from Quidax API');
        }

        // Reset circuit breaker on successful request
        await redis.del(CIRCUIT_BREAKER_KEY);
        await redis.del(`${CIRCUIT_BREAKER_KEY}:count`);

        // Cache the data with both TTLs
        await Promise.all([
          redis.set(CACHE_KEY, data.data, {
            ex: CACHE_TTL
          }),
          redis.set(`${CACHE_KEY}:stale`, data.data, {
            ex: STALE_TTL
          })
        ]);

        return NextResponse.json({
          status: 'success',
          data: data.data,
          source: 'api'
        });
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES - 1) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // If all retries failed, increment failure count
    const failures = await redis.incr(`${CIRCUIT_BREAKER_KEY}:count`);
    if (failures >= 3) { // Trip after 3 failures
      await redis.set(CIRCUIT_BREAKER_KEY, true, {
        ex: CIRCUIT_TTL
      });
    }

    // Try to return stale cache if all retries fail
    const staleData = await redis.get(`${CACHE_KEY}:stale`);
    if (staleData) {
      return NextResponse.json({
        status: 'success',
        data: staleData,
        source: 'stale_cache_retry_failed'
      });
    }

    throw lastError;
  } catch (error) {
    console.error('Error fetching market tickers:', error);
    
    // Final attempt to get any cached data
    try {
      const staleData = await redis.get(`${CACHE_KEY}:stale`);
      if (staleData) {
        return NextResponse.json({
          status: 'success',
          data: staleData,
          source: 'stale_cache_error'
        });
      }
    } catch (cacheError) {
      console.error('Cache error:', cacheError);
    }

    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch market data'
      },
      { status: 500 }
    );
  }
}