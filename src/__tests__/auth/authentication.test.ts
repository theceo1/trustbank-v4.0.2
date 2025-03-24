import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { checkAndRefreshSession, validateSession } from '@/lib/auth';
import { Session } from '@supabase/supabase-js';

describe('Authentication Tests', () => {
  // Mock Supabase client
  const mockSupabase = {
    auth: {
      refreshSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      verifyOtp: jest.fn(),
      mfa: {
        enroll: jest.fn(),
        verify: jest.fn(),
        unenroll: jest.fn(),
        challenge: jest.fn()
      }
    },
  };

  // Mock session data
  const mockSession: Session = {
    access_token: 'mock_token',
    refresh_token: 'mock_refresh_token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 240,
    token_type: 'bearer',
    user: { id: '123', email: 'test@example.com' } as any,
  };

  // Authentication handler functions
  const handleLogin = async (email: string, password: string) => {
    const response = await mockSupabase.auth.signInWithPassword({ email, password });
    return response;
  };

  const handlePasswordReset = async (email: string) => {
    const response = await mockSupabase.auth.resetPasswordForEmail(email);
    return response;
  };

  const handleEmailVerification = async (token: string) => {
    const response = await mockSupabase.auth.verifyOtp({
      token,
      type: 'email'
    });
    return response;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should validate active session', async () => {
      const validSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      const isValid = validateSession(validSession);
      expect(isValid).toBe(true);
    });

    it('should invalidate expired session', async () => {
      const expiredSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };

      const isValid = validateSession(expiredSession);
      expect(isValid).toBe(false);
    });

    it('should handle null session', async () => {
      const isValid = validateSession(null);
      expect(isValid).toBe(false);
    });

    it('should not refresh session if expiry is far', async () => {
      const validSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      const refreshedSession = await checkAndRefreshSession(validSession);
      expect(mockSupabase.auth.refreshSession).not.toHaveBeenCalled();
      expect(refreshedSession).toBe(validSession);
    });

    it('should refresh session when close to expiry', async () => {
      const mockSession: Session = {
        access_token: 'mock_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 240,
        token_type: 'bearer',
        user: { id: '123', email: 'test@example.com' } as any,
      };

      const newExpiryTime = Math.floor(Date.now() / 1000) + 3600;
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: {
          session: {
            ...mockSession,
            expires_at: newExpiryTime,
          },
        },
        error: null,
      });

      const refreshedSession = await checkAndRefreshSession(mockSession);
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
      expect(refreshedSession?.expires_at).toBe(newExpiryTime);
    });

    it('should handle refresh session failure', async () => {
      const mockSession: Session = {
        access_token: 'mock_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 240,
        token_type: 'bearer',
        user: { id: '123', email: 'test@example.com' } as any,
      };

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Failed to refresh'),
      });

      const refreshedSession = await checkAndRefreshSession(mockSession);
      expect(refreshedSession).toBeNull();
    });
  });

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockAuthResponse = {
        data: {
          session: {
            access_token: 'mock_token',
            refresh_token: 'mock_refresh_token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: '123', email: mockCredentials.email },
          },
        },
        error: null,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockAuthResponse);

      const response = await mockSupabase.auth.signInWithPassword(mockCredentials);
      expect(response.error).toBeNull();
      expect(response.data.session).toBeDefined();
      expect(response.data.session.access_token).toBe('mock_token');
    });

    it('should handle login failure with invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid credentials', status: 401 }
      });

      const result = await handleLogin('test@example.com', 'wrongpassword');
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toBe('Invalid credentials');
    });

    it('should handle login failure with rate limiting', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Too many requests', status: 429 }
      });

      const result = await handleLogin('test@example.com', 'password123');
      expect(result.error).toBeTruthy();
      expect(result.error?.status).toBe(429);
    });
  });

  describe('Logout Flow', () => {
    it('should handle successful logout', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      });

      const result = await mockSupabase.auth.signOut();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });

    it('should handle logout failure', async () => {
      const mockError = { message: 'Network error', status: 500 };
      mockSupabase.auth.signOut.mockResolvedValue({
        error: mockError
      });

      const result = await mockSupabase.auth.signOut();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result.error).toBe(mockError);
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email successfully', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      });

      const result = await handlePasswordReset('test@example.com');
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.error).toBeNull();
    });

    it('should handle password reset for non-existent email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'User not found', status: 404 }
      });

      const result = await handlePasswordReset('nonexistent@example.com');
      expect(result.error?.message).toBe('User not found');
    });
  });

  describe('Email Verification Flow', () => {
    it('should verify email successfully', async () => {
      const mockToken = 'valid-verification-token';
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await handleEmailVerification(mockToken);
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        token: mockToken,
        type: 'email'
      });
      expect(result.error).toBeNull();
      expect(result.data?.session).toBeTruthy();
    });

    it('should handle invalid verification token', async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid or expired token', status: 400 }
      });

      const result = await handleEmailVerification('invalid-token');
      expect(result.error?.message).toBe('Invalid or expired token');
    });
  });

  describe('Two-Factor Authentication', () => {
    const mockTwoFactorSecret = 'JBSWY3DPEHPK3PXP';
    const mockValidToken = '123456';

    beforeEach(() => {
      mockSupabase.auth = {
        ...mockSupabase.auth,
        mfa: {
          enroll: jest.fn(),
          verify: jest.fn(),
          unenroll: jest.fn(),
          challenge: jest.fn()
        }
      };
    });

    it('should enroll in 2FA successfully', async () => {
      mockSupabase.auth.mfa.enroll.mockResolvedValue({
        data: {
          id: 'factor_id',
          secret: mockTwoFactorSecret,
          qr_code: 'data:image/png;base64,mockQrCodeData'
        },
        error: null
      });

      const result = await mockSupabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      expect(result.error).toBeNull();
      expect(result.data?.secret).toBe(mockTwoFactorSecret);
    });

    it('should verify 2FA token successfully', async () => {
      mockSupabase.auth.mfa.verify.mockResolvedValue({
        data: { 
          user: mockSession.user,
          session: mockSession
        },
        error: null
      });

      const result = await mockSupabase.auth.mfa.verify({
        factorId: 'factor_id',
        code: mockValidToken
      });

      expect(result.error).toBeNull();
      expect(result.data?.session).toBeTruthy();
    });

    it('should handle invalid 2FA token', async () => {
      mockSupabase.auth.mfa.verify.mockResolvedValue({
        data: null,
        error: { message: 'Invalid 2FA token', status: 401 }
      });

      const result = await mockSupabase.auth.mfa.verify({
        factorId: 'factor_id',
        code: '000000'
      });

      expect(result.error?.message).toBe('Invalid 2FA token');
    });

    it('should unenroll from 2FA successfully', async () => {
      mockSupabase.auth.mfa.unenroll.mockResolvedValue({
        data: { id: 'factor_id' },
        error: null
      });

      const result = await mockSupabase.auth.mfa.unenroll({
        factorId: 'factor_id'
      });

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe('factor_id');
    });

    it('should handle 2FA challenge', async () => {
      mockSupabase.auth.mfa.challenge.mockResolvedValue({
        data: { id: 'challenge_id' },
        error: null
      });

      const result = await mockSupabase.auth.mfa.challenge({
        factorId: 'factor_id'
      });

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe('challenge_id');
    });
  });
}); 