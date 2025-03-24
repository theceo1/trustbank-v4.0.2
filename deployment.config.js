module.exports = {
  // Environment configurations
  environment: {
    production: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      API_KEYS: {
        QUIDAX_API_KEY: process.env.QUIDAX_API_KEY,
        DOJAH_API_KEY: process.env.DOJAH_API_KEY,
      }
    },
    staging: {
      NODE_ENV: 'staging',
      // Add staging-specific configurations
    },
    development: {
      NODE_ENV: 'development',
      // Add development-specific configurations
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    transports: ['console', 'file'],
    fileOptions: {
      filename: 'logs/app.log',
      maxSize: '10m',
      maxFiles: '7d'
    }
  },

  // Monitoring configuration
  monitoring: {
    sentry: {
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: process.env.NODE_ENV,
    },
    performance: {
      apiTimeout: 30000,
      slowQueryThreshold: 1000,
      memoryWarningThreshold: 90 // percentage
    }
  },

  // Backup configuration
  backup: {
    database: {
      schedule: '0 0 * * *', // Daily at midnight
      retention: '30d',
      storage: 's3'
    },
    files: {
      schedule: '0 0 * * 0', // Weekly on Sunday
      retention: '90d',
      storage: 's3'
    }
  },

  // Deployment settings
  deployment: {
    region: process.env.DEPLOYMENT_REGION || 'us-east-1',
    instances: process.env.INSTANCE_COUNT || 2,
    autoscaling: {
      min: 2,
      max: 10,
      targetCPUUtilization: 70
    },
    healthCheck: {
      path: '/api/health',
      interval: 30,
      timeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 3
    }
  }
}; 