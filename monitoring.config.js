module.exports = {
  // Vercel Speed Insights configuration
  speedInsights: {
    enabled: true,
    debug: process.env.NODE_ENV === 'development',
  },

  // Vercel Analytics configuration
  analytics: {
    enabled: true,
    debug: process.env.NODE_ENV === 'development',
  },

  // Custom monitoring endpoints
  endpoints: [
    {
      name: 'API Health',
      url: '/api/health',
      expectedStatus: 200,
      interval: '1m',
    },
    {
      name: 'Market Data',
      url: '/api/markets/tickers',
      expectedStatus: 200,
      interval: '1m',
    },
    {
      name: 'Database Connection',
      url: '/api/health/db',
      expectedStatus: 200,
      interval: '5m',
    },
  ],

  // Alert thresholds
  alerts: {
    responseTime: {
      warning: 1000, // 1 second
      critical: 3000, // 3 seconds
    },
    errorRate: {
      warning: 0.01, // 1%
      critical: 0.05, // 5%
    },
    uptimeTarget: 0.999, // 99.9% uptime target
  },

  // Logging configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: 'json',
    transports: ['console', 'vercel'],
  },
} 