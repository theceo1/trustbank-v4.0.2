import * as Sentry from '@sentry/nextjs';

interface RequestData {
  accountNumber?: string;
  bankCode?: string;
  [key: string]: any;
}

// Initialize Sentry with custom configuration
export function initMonitoring() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request?.data) {
        const data = event.request.data as RequestData;
        if (data.accountNumber) {
          data.accountNumber = '[REDACTED]';
        }
        if (data.bankCode) {
          data.bankCode = '[REDACTED]';
        }
      }
      return event;
    },
  });
}

// Custom error tracking for payment operations
export function trackPaymentError(error: any, context: Record<string, any>) {
  Sentry.withScope((scope) => {
    scope.setLevel('error');
    scope.setTag('category', 'payment');
    scope.setTag('provider', 'korapay');
    scope.setContext('payment_context', context);
    Sentry.captureException(error);
  });
}

// Performance monitoring for payment operations
export function trackPaymentPerformance(operation: string, duration: number, context: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: 'performance',
    message: `Payment operation: ${operation}`,
    level: 'info',
    data: {
      duration,
      ...context,
    },
  });
}

// Monitor unusual transaction patterns
export function monitorTransactionPatterns(transaction: {
  userId: string;
  amount: number;
  currency: string;
  type: string;
}) {
  const { amount, currency, type } = transaction;
  
  // Alert on unusually large transactions
  if (amount > 10000000) { // 10 million NGN
    Sentry.captureMessage('Large transaction detected', {
      level: 'warning',
      tags: {
        category: 'transaction',
        type: 'large_amount',
      },
      contexts: {
        transaction: transaction as any,
      },
    });
  }

  // Alert on unusual currency combinations
  if (currency !== 'NGN' && type === 'withdrawal') {
    Sentry.captureMessage('Unusual currency withdrawal', {
      level: 'warning',
      tags: {
        category: 'transaction',
        type: 'unusual_currency',
      },
      contexts: {
        transaction: transaction as any,
      },
    });
  }
}

// Monitor API response times
export function monitorApiResponseTime(endpoint: string, duration: number) {
  if (duration > 5000) { // 5 seconds
    Sentry.captureMessage('Slow API response', {
      level: 'warning',
      tags: {
        category: 'performance',
        endpoint,
      },
      contexts: {
        performance: {
          duration,
          endpoint,
        },
      },
    });
  }
} 