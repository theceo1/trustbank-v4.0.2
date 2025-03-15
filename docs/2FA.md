# Two-Factor Authentication (2FA) Documentation

## Overview

The trustBank platform implements a robust two-factor authentication system to enhance security for sensitive operations. This document outlines the implementation details, usage, and security considerations.

## Features

- Mandatory 2FA for withdrawals and P2P trading
- QR code-based setup with authenticator apps
- Backup codes for account recovery
- Rate limiting to prevent brute force attacks
- Secure storage of 2FA secrets

## Implementation Details

### Components

1. **TwoFactorSetup Component** (`src/components/security/TwoFactorSetup.tsx`)
   - Handles the 2FA setup process
   - Generates QR codes for authenticator apps
   - Manages backup codes
   - Updates security settings in the database

2. **API Routes**
   - `/api/auth/2fa/setup`: Generates 2FA secrets
   - `/api/auth/2fa/verify`: Validates 2FA codes
   - Protected by rate limiting

3. **Middleware** (`src/middleware/requireTwoFactor.ts`)
   - Enforces 2FA for sensitive operations
   - Validates 2FA tokens
   - Integrates with rate limiting

### Database Schema

```sql
CREATE TABLE security_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  backup_codes TEXT[] DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id)
);
```

### Protected Routes

The following routes require 2FA verification:
- `/api/wallet/withdraw/*`
- `/api/trades/p2p/orders/*`
- `/api/trades/p2p/trades/*`

## Security Measures

1. **Rate Limiting**
   - 10 requests per 10 seconds per IP
   - Applies to 2FA setup and verification endpoints
   - Prevents brute force attacks

2. **Secret Storage**
   - 2FA secrets stored securely in the database
   - Backup codes are hashed using SHA-256
   - Row-level security policies enforce access control

3. **Token Validation**
   - Uses the `otplib` library for TOTP implementation
   - Validates token freshness and correctness
   - Implements proper error handling

## Usage Guide

### Setting Up 2FA

1. Navigate to security settings
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes securely

### Using 2FA

1. Initiate a protected operation
2. Enter 2FA code from authenticator app
3. Operation proceeds if code is valid

### Recovery Process

1. Use backup codes if authenticator app is unavailable
2. Each backup code can be used only once
3. Contact support if all backup codes are exhausted

## Error Handling

- Invalid codes return 401 Unauthorized
- Rate limit exceeded returns 429 Too Many Requests
- Missing 2FA setup returns 403 Forbidden

## Best Practices

1. **For Users**
   - Use a reliable authenticator app
   - Store backup codes securely
   - Don't share 2FA codes
   - Enable 2FA immediately after account creation

2. **For Developers**
   - Always verify 2FA status before sensitive operations
   - Implement proper rate limiting
   - Use secure storage for secrets
   - Regularly audit 2FA usage and failures

## Dependencies

- `otplib`: TOTP implementation
- `@upstash/ratelimit`: Rate limiting
- `@upstash/redis`: Redis client for rate limiting
- `qrcode.react`: QR code generation

## Testing

Run the following tests to verify 2FA functionality:
```bash
npm run test:2fa
```

## Monitoring

Monitor 2FA-related events:
- Failed verification attempts
- Rate limit hits
- Backup code usage
- New 2FA enablements

## Support

For issues with 2FA:
1. Check the backup codes
2. Contact support with user ID and issue details
3. Verify identity through alternative means 