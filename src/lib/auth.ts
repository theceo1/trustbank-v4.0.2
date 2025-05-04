import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';
import { Session } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export async function signUp(data: SignUpData) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new Error('Invalid email format');
  }

  // Validate password strength
  if (data.password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const supabase = createClientComponentClient<Database>();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return authData;
}

export function validateSession(session: Session | null): boolean {
  if (!session) return false;
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at ? session.expires_at > now : false;
}

export async function checkAndRefreshSession(session: Session | null): Promise<Session | null> {
  if (!session) return null;
  
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = session.expires_at ? session.expires_at - now : 0;
  
  // Refresh if session expires in less than 5 minutes
  if (timeUntilExpiry < 300) {
    const supabase = createClientComponentClient<Database>();
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Failed to refresh session:', error);
      return null;
    }
    return data.session;
  }
  
  return session;
}

export function handleAuthError(error: any) {
  if (error.message?.includes('expired')) {
    return {
      type: 'expired',
      message: 'Your session has expired. Please log in again.',
    };
  }
  
  if (error.message?.includes('invalid')) {
    return {
      type: 'invalid',
      message: 'Invalid credentials. Please try again.',
    };
  }
  
  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
  };
} 