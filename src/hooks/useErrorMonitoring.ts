import * as Sentry from '@sentry/nextjs';
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ErrorContext {
  [key: string]: any;
}

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

export function useErrorMonitoring() {
  const { user } = useAuth();

  useEffect(() => {
    // Set user context in Sentry when user changes
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  const captureError = useCallback((error: Error, context?: ErrorContext) => {
    // Add error to Sentry
    Sentry.withScope((scope) => {
      // Add additional context
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      // Add user context
      if (user) {
        scope.setUser({
          id: user.id,
          email: user.email,
        });
      }

      // Add error context
      scope.setLevel('error');
      
      // Capture the error
      Sentry.captureException(error);
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', {
        error,
        context,
        user: user ? { id: user.id, email: user.email } : null,
      });
    }
  }, [user]);

  const captureMessage = useCallback((message: string, level: SeverityLevel = 'info', context?: ErrorContext) => {
    // Add message to Sentry
    Sentry.withScope((scope) => {
      // Add additional context
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      // Add user context
      if (user) {
        scope.setUser({
          id: user.id,
          email: user.email,
        });
      }

      // Set message level
      scope.setLevel(level);
      
      // Capture the message
      Sentry.captureMessage(message);
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level}] ${message}`, {
        context,
        user: user ? { id: user.id, email: user.email } : null,
      });
    }
  }, [user]);

  return {
    captureError,
    captureMessage,
    SeverityLevel: {
      Fatal: 'fatal' as const,
      Error: 'error' as const,
      Warning: 'warning' as const,
      Log: 'log' as const,
      Info: 'info' as const,
      Debug: 'debug' as const,
    },
  };
} 