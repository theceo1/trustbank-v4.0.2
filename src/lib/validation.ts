import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import sqlstring from 'sqlstring';

// Common validation patterns
const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[1-9]\d{1,14}$/, // International phone number format
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9_-]{3,16}$/,
  currency: /^[A-Z]{3,4}$/, // Currency code format (e.g., USD, USDT)
  referralCode: /^[A-Z0-9]{8}$/, // 8-character alphanumeric code
  quidaxId: /^[a-zA-Z0-9-]{10,}$/, // Quidax ID format
  url: /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/ // URL pattern
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Basic sanitization
  let sanitized = input.trim();
  
  // Remove any HTML/script tags
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  });
  
  // Escape special characters
  sanitized = sqlstring.escape(sanitized);
  
  return sanitized;
};

// XSS Prevention
export const sanitizeHtml = (html: string, allowedTags: string[] = []): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'target', 'rel'], // Only allow safe attributes
    ALLOW_DATA_ATTR: false, // Prevent data-* attributes
    ADD_TAGS: ['noopener'], // Add safe link behavior
    SANITIZE_DOM: true,
  });
};

// SQL Injection Prevention
export const escapeSqlString = (value: string): string => {
  return sqlstring.escape(value);
};

// Common validation schemas using Zod
export const schemas = {
  email: z.string().email().min(5).max(255),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must not exceed 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character'),
  
  phone: z.string().regex(patterns.phone, 'Invalid phone number format'),
  
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(16, 'Username must not exceed 16 characters')
    .regex(patterns.username, 'Username can only contain letters, numbers, underscores, and hyphens'),
  
  url: z.string().url().or(z.string().regex(patterns.url, 'Invalid URL format')),
  
  amount: z.number()
    .positive('Amount must be positive')
    .finite('Amount must be finite')
    .safe('Amount must be within safe integer limits'),
    
  date: z.date()
    .min(new Date('1900-01-01'), 'Date must be after 1900')
    .max(new Date('2100-01-01'), 'Date must be before 2100'),
};

// Validation middleware for API routes
export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request) => {
    try {
      let data: any;
      
      // Parse request body based on content type
      if (req.headers.get('content-type')?.includes('application/json')) {
        data = await req.json();
      } else if (req.headers.get('content-type')?.includes('multipart/form-data')) {
        const formData = await req.formData();
        data = Object.fromEntries(formData);
      } else {
        throw new Error('Unsupported content type');
      }

      // Sanitize all string inputs
      const sanitizedData = Object.entries(data).reduce((acc: any, [key, value]) => {
        acc[key] = typeof value === 'string' ? sanitizeInput(value) : value;
        return acc;
      }, {});

      // Validate against schema
      const validatedData = schema.parse(sanitizedData);
      return { success: true, data: validatedData };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: {
            message: 'Validation failed',
            details: error.errors,
          },
        };
      }
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  };
};

// Validation schemas for different entities
export const validationSchemas = {
  userProfile: z.object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    phone_number: z.string().regex(patterns.phone, 'Invalid phone number format').optional(),
    kyc_level: z.enum(['basic', 'intermediate', 'advanced']).default('basic'),
    quidax_id: z.string().regex(patterns.quidaxId, 'Invalid Quidax ID format').optional()
  }),

  securitySettings: z.object({
    two_factor_enabled: z.boolean(),
    two_factor_secret: z.string().optional(),
    backup_codes: z.array(z.string()).optional(),
    last_login: z.string().datetime().optional()
  }),

  transaction: z.object({
    type: z.enum(['deposit', 'withdrawal', 'transfer', 'swap']),
    amount: z.number().positive(),
    currency: z.string().regex(patterns.currency),
    status: z.enum(['pending', 'completed', 'failed']),
    reference: z.string().optional(),
    metadata: z.record(z.any()).optional()
  }),

  p2pOrder: z.object({
    type: z.enum(['buy', 'sell']),
    currency: z.enum(['BTC', 'ETH', 'USDT', 'USDC']),
    amount: z.number().positive(),
    price: z.number().positive(),
    min_order: z.number().positive(),
    max_order: z.number().positive(),
    payment_methods: z.array(z.string()),
    terms: z.string(),
    status: z.enum(['active', 'completed', 'cancelled']).default('active')
  }),

  kycRecord: z.object({
    tier: z.enum(['basic', 'intermediate', 'advanced']).default('basic'),
    status: z.enum(['pending', 'verified', 'rejected']).default('pending'),
    verification_status: z.enum(['Ongoing', 'Completed', 'Pending', 'Failed']).default('Pending'),
    verification_data: z.record(z.any()).optional()
  }),

  swapTransaction: z.object({
    from_currency: z.string().regex(patterns.currency),
    to_currency: z.string().regex(patterns.currency),
    from_amount: z.number().positive(),
    to_amount: z.number().positive(),
    execution_price: z.number().positive(),
    status: z.enum(['pending', 'completed', 'failed']),
    reference: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })
};

// Helper function to validate and sanitize query parameters
export const validateQueryParams = (
  params: URLSearchParams,
  schema: z.ZodSchema
) => {
  const queryObj = Object.fromEntries(params.entries());
  const sanitizedQuery = Object.entries(queryObj).reduce((acc: any, [key, value]) => {
    acc[key] = sanitizeInput(value);
    return acc;
  }, {});
  
  try {
    return {
      success: true,
      data: schema.parse(sanitizedQuery),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Invalid query parameters',
    };
  }
};

// Rate limiting helper
export const createRateLimiter = (
  maxRequests: number,
  windowMs: number
) => {
  const requests = new Map<string, number[]>();
  
  return (ip: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this IP
    const userRequests = requests.get(ip) || [];
    
    // Filter out old requests
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    // Check if user has exceeded limit
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(ip, recentRequests);
    
    return true;
  };
}; 