import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateRequest, validateQueryParams } from '@/lib/validation';
import { z } from 'zod';

export async function validationMiddleware(
  request: NextRequest,
  schema: z.ZodSchema,
  validateQuery: boolean = false
) {
  try {
    // Validate query parameters if required
    if (validateQuery) {
      const queryValidation = validateQueryParams(request.nextUrl.searchParams, schema);
      if (!queryValidation.success) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: queryValidation.error },
          { status: 400 }
        );
      }
    }

    // For POST/PUT/PATCH requests, validate body
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const validation = await validateRequest(schema)(request);
      
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error },
          { status: 400 }
        );
      }

      // Add validated data to request context
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-validated-data', JSON.stringify(validation.data));

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // For other methods, just continue
    return NextResponse.next();
  } catch (error) {
    console.error('Validation middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper to extract validated data from request
export function getValidatedData<T>(request: NextRequest): T | null {
  const validatedData = request.headers.get('x-validated-data');
  if (!validatedData) return null;
  
  try {
    return JSON.parse(validatedData) as T;
  } catch {
    return null;
  }
} 