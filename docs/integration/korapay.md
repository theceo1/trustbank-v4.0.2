# KoraPay Integration Guide

## Introduction
This guide will help you integrate the KoraPay payment system into your application. KoraPay provides a secure and reliable way to handle bank transfers in Nigeria.

## Prerequisites
1. TrustBank account with KoraPay integration enabled
2. API credentials (public key, secret key, signing key)
3. IP whitelisting configured for your servers

## Setup

### 1. Environment Variables
Add the following environment variables to your `.env` file:

```env
KORAPAY_API_URL=https://api.korapay.com/merchant/api/v1
KORAPAY_PUBLIC_KEY=your_public_key
KORAPAY_SECRET_KEY=your_secret_key
KORAPAY_SIGNING_KEY=your_signing_key
```

### 2. Database Setup
Run the following migrations to set up the required database tables:

```sql
-- Create korapay_transfers table
CREATE TABLE IF NOT EXISTS korapay_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT,
  status TEXT NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Integration Steps

### 1. Bank Account Verification
Before initiating a transfer, verify the recipient's bank account:

```typescript
import { korapayService } from '@/lib/services/korapay';

async function verifyAccount(bankCode: string, accountNumber: string) {
  try {
    const response = await korapayService.verifyAccount(bankCode, accountNumber);
    if (response.status) {
      console.log('Account verified:', response.data);
      return response.data;
    } else {
      throw new Error(response.message || 'Verification failed');
    }
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
}
```

### 2. Initiate Transfer
To initiate a bank transfer:

```typescript
import { korapayService } from '@/lib/services/korapay';

async function initiateTransfer(params: {
  amount: number;
  currency: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  narration?: string;
  userId: string;
}) {
  try {
    const response = await korapayService.initiateTransfer(params);
    if (response.status === 'success') {
      console.log('Transfer initiated:', response.data);
      return response.data;
    } else {
      throw new Error(response.message || 'Transfer failed');
    }
  } catch (error) {
    console.error('Transfer error:', error);
    throw error;
  }
}
```

### 3. Get Bank List
To retrieve the list of supported banks:

```typescript
import { korapayService } from '@/lib/services/korapay';

async function getBanks() {
  try {
    const response = await korapayService.getBanks();
    if (response.status) {
      console.log('Banks retrieved:', response.data);
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to fetch banks');
    }
  } catch (error) {
    console.error('Error fetching banks:', error);
    throw error;
  }
}
```

## Error Handling

### Common Errors
1. **Rate Limit Exceeded**
   - Error code: `RATE_LIMIT_EXCEEDED`
   - Solution: Implement exponential backoff

2. **Invalid Account**
   - Error code: `INVALID_ACCOUNT`
   - Solution: Verify account details and try again

3. **Insufficient Funds**
   - Error code: `INSUFFICIENT_FUNDS`
   - Solution: Check account balance

### Error Handling Example
```typescript
try {
  const response = await korapayService.initiateTransfer(params);
  // Handle success
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Implement backoff strategy
    await new Promise(resolve => setTimeout(resolve, 1000));
    return initiateTransfer(params);
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    // Handle insufficient funds
    throw new Error('Please ensure sufficient funds are available');
  } else {
    // Handle other errors
    throw error;
  }
}
```

## Security Best Practices

1. **IP Whitelisting**
   - Configure IP whitelisting for your production servers
   - Use environment-specific whitelists

2. **Request Signing**
   - Always sign sensitive requests
   - Keep signing keys secure

3. **Rate Limiting**
   - Implement client-side rate limiting
   - Handle rate limit errors gracefully

4. **Data Protection**
   - Never log sensitive data
   - Use encryption for sensitive information
   - Implement proper access controls

## Testing

### Unit Tests
Run unit tests:
```bash
npm run test
```

### Load Tests
Run load tests:
```bash
npm run test:load
```

## Monitoring

### Key Metrics
1. API response times
2. Error rates
3. Transaction success rates
4. Unusual activity patterns

### Setting Up Alerts
Configure alerts for:
- High error rates
- Slow response times
- Failed transfers
- Unusual transaction patterns

## Support
For additional support:
- Email: support@trustbank.tech
- Documentation: https://docs.trustbank.tech
- API Reference: https://docs.trustbank.tech/api/korapay 