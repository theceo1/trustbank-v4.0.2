import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { type Session } from '@supabase/supabase-js';

const REFRESH_THRESHOLD = 5 * 60; // 5 minutes in seconds

export const checkAndRefreshSession = async (session: Session | null) => {
  if (!session) return null;

  const supabase = createClientComponentClient();
  const expiresAt = session?.expires_at || 0;
  const timeNow = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = expiresAt - timeNow;

  // If token is about to expire in the next 5 minutes, refresh it
  if (timeUntilExpiry < REFRESH_THRESHOLD) {
    const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
    return newSession;
  }

  return session;
};

export const validateSession = (session: Session | null): boolean => {
  if (!session) return false;

  const timeNow = Math.floor(Date.now() / 1000);
  return session.expires_at ? session.expires_at > timeNow : false;
};

export const getSessionExpiryStatus = (session: Session | null) => {
  if (!session?.expires_at) return { isValid: false, timeRemaining: 0 };

  const timeNow = Math.floor(Date.now() / 1000);
  const timeRemaining = session.expires_at - timeNow;

  return {
    isValid: timeRemaining > 0,
    timeRemaining,
    needsRefresh: timeRemaining < REFRESH_THRESHOLD
  };
};

export const handleAuthError = (error: any) => {
  // Common auth error handling
  if (error.message.includes('expired')) {
    return { type: 'expired', message: 'Your session has expired. Please log in again.' };
  }
  if (error.message.includes('invalid')) {
    return { type: 'invalid', message: 'Invalid authentication credentials.' };
  }
  return { type: 'unknown', message: 'An authentication error occurred.' };
}; 