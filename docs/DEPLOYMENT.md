# Deployment Guide

## Prerequisites

- Vercel account
- Supabase account
- Upstash Redis account
- Domain name (optional)
- GitHub account

## Environment Setup

1. **Production Environment Variables**

Create a `.env.production` file with the following variables:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Quidax API
QUIDAX_SECRET_KEY=your_production_quidax_secret_key
QUIDAX_PUBLIC_KEY=your_production_quidax_public_key

# Dojah API
DOJAH_API_KEY=your_production_dojah_api_key
DOJAH_APP_ID=your_production_dojah_app_id

# Redis
UPSTASH_REDIS_REST_URL=your_production_redis_url
UPSTASH_REDIS_REST_TOKEN=your_production_redis_token

# Security
JWT_SECRET=your_production_jwt_secret
ENCRYPTION_KEY=your_production_encryption_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

2. **Database Setup**

```bash
# Run production migrations
npm run db:migrate:prod

# Verify database setup
npm run db:verify
```

## Vercel Deployment

1. **Connect Repository**
   - Fork the repository to your GitHub account
   - Create a new project in Vercel
   - Connect to your GitHub repository

2. **Configure Build Settings**
   ```bash
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Environment Variables**
   - Add all production environment variables to Vercel project settings
   - Enable "Production Only" for sensitive variables

4. **Domain Setup**
   - Add custom domain in Vercel project settings
   - Configure DNS settings
   - Enable HTTPS

## CI/CD Pipeline

1. **GitHub Actions Setup**

Create `.github/workflows/main.yml`:
```yaml
name: CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run linting
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          vercel-args: '--prod'
```

2. **Vercel Integration**
   - Generate Vercel token
   - Add secrets to GitHub repository
   - Configure webhook for automatic deployments

## Monitoring Setup

1. **Sentry Integration**
```bash
npm install @sentry/nextjs
```

2. **Configure Sentry**
Create `sentry.client.config.js`:
```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

3. **Error Tracking**
   - Set up error boundaries
   - Configure performance monitoring
   - Set up alerts

## Backup Strategy

1. **Database Backups**
   - Enable daily automated backups in Supabase
   - Configure backup retention period
   - Test backup restoration process

2. **File Storage Backups**
   - Configure S3 bucket versioning
   - Set up cross-region replication
   - Implement backup rotation

## Security Measures

1. **SSL Configuration**
   - Enable HTTPS only
   - Configure HSTS
   - Set up CSP headers

2. **Rate Limiting**
   - Configure Redis rate limiting
   - Set up IP blocking
   - Monitor abuse patterns

3. **Security Headers**
Configure `next.config.js`:
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  // Add more security headers
];
```

## Performance Optimization

1. **Build Optimization**
```bash
# Analyze bundle size
npm run analyze

# Optimize images
npm run optimize-images
```

2. **Cache Configuration**
   - Configure CDN caching
   - Set up Redis caching
   - Implement service worker

## Rollback Procedure

1. **Quick Rollback**
```bash
# Revert to previous deployment
vercel rollback

# Verify rollback
vercel logs
```

2. **Database Rollback**
   - Keep migration versions
   - Document rollback procedures
   - Test rollback process

## Health Checks

1. **Monitoring Endpoints**
   - Set up /health endpoint
   - Configure uptime monitoring
   - Set up status page

2. **Alerts**
   - Configure error alerts
   - Set up performance alerts
   - Define incident response

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] DNS configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Security headers enabled
- [ ] Rate limiting active
- [ ] Error tracking working
- [ ] Performance optimized
- [ ] Health checks running
- [ ] Alerts configured
- [ ] Documentation updated 