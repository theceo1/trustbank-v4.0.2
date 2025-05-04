import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp } from '../../lib/auth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

describe('Signup', () => {
  const mockSupabase = {
    auth: {
      signUp: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClientComponentClient as any).mockReturnValue(mockSupabase);
  });

  it('should successfully sign up a user', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      user_metadata: {
        first_name: 'John',
        last_name: 'Doe',
      },
    };

    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const result = await signUp({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    });

    expect(result.user).toBeDefined();
    expect(result.user?.id).toBe('123');
    expect(result.user?.email).toBe('test@example.com');
    expect(result.user?.user_metadata.first_name).toBe('John');
    expect(result.user?.user_metadata.last_name).toBe('Doe');
  });

  it('should throw error for invalid email', async () => {
    await expect(
      signUp({
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      })
    ).rejects.toThrow('Invalid email format');
  });

  it('should throw error for short password', async () => {
    await expect(
      signUp({
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
      })
    ).rejects.toThrow('Password must be at least 8 characters long');
  });

  it('should handle signup errors', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Signup failed'),
    });

    await expect(
      signUp({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      })
    ).rejects.toThrow('Signup failed');
  });
}); 