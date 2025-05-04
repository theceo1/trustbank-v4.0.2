import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
process.env.KORAPAY_PUBLIC_KEY = 'test_public_key';
process.env.KORAPAY_SECRET_KEY = 'test_secret_key';
process.env.KORAPAY_ENCRYPTION_KEY = 'test_encryption_key_32_chars_long_';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isFallback: false,
    isReady: true,
    isPreview: false,
  }),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
      expires: new Date(Date.now() + 3600).toISOString(),
    },
    status: 'authenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Supabase client
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    execute: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

// Mock fetch
global.fetch = vi.fn().mockImplementation((url, options) => {
  if (url.includes('korapay')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        status: true,
        message: 'Success',
        data: {
          reference: 'test_ref',
          status: 'success',
          amount: 1000,
          currency: 'NGN',
        },
      }),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
}); 