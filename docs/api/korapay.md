# KoraPay Integration API Documentation

## Overview
This document describes the API endpoints for the KoraPay integration in trustBank. KoraPay is used for handling fiat payment rails, specifically for bank transfers in Nigeria.

## Authentication
All endpoints require authentication using a Bearer token. The token should be included in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Rate Limiting
The following rate limits apply to the payment endpoints:

- General payment endpoints: 10 requests per minute
- Sensitive operations (transfers, verifications): 5 requests per minute

## Endpoints

### Verify Bank Account
Verifies a bank account number with the specified bank.

**Endpoint:** `POST /api/payments/korapay/verify`

**Request Body:**
```json
{
  "bankCode": "044",
  "accountNumber": "1234567890"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "account_name": "John Doe",
    "account_number": "1234567890",
    "bank_name": "Access Bank"
  }
}
```

**Error Codes:**
- `400`: Invalid request (missing fields, invalid format)
- `401`: Unauthorized
- `403`: IP not whitelisted
- `429`: Rate limit exceeded
- `500`: Internal server error

### Initiate Transfer
Initiates a bank transfer to the specified account.

**Endpoint:** `POST /api/payments/korapay/transfer`

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "NGN",
  "bankCode": "044",
  "accountNumber": "1234567890",
  "accountName": "John Doe",
  "narration": "Transfer from trustBank"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Transfer initiated successfully",
  "data": {
    "reference": "KPY-123456",
    "amount": 1000,
    "currency": "NGN",
    "status": "pending",
    "beneficiary": {
      "account_number": "1234567890",
      "bank_code": "044",
      "name": "John Doe"
    }
  }
}
```

**Error Codes:**
- `400`: Invalid request (missing fields, invalid format)
- `401`: Unauthorized
- `403`: IP not whitelisted
- `429`: Rate limit exceeded
- `500`: Internal server error

### Get Bank List
Retrieves the list of supported banks.

**Endpoint:** `GET /api/payments/korapay/banks`

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "code": "044",
      "name": "Access Bank",
      "slug": "access-bank"
    },
    {
      "code": "033",
      "name": "UBA",
      "slug": "uba"
    }
  ]
}
```

**Error Codes:**
- `401`: Unauthorized
- `429`: Rate limit exceeded
- `500`: Internal server error

## Error Handling
All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `INVALID_REQUEST`: Invalid request parameters
- `UNAUTHORIZED`: Authentication failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Security Considerations
1. All sensitive data is encrypted in transit using TLS
2. IP whitelisting is enforced for sensitive operations
3. Request signing is required for all sensitive operations
4. Rate limiting is implemented to prevent abuse
5. Audit logging is performed for all financial transactions

## Monitoring
The following metrics are monitored:
- API response times
- Error rates
- Transaction patterns
- Failed transfers
- Unusual activity

## Testing
The integration includes:
- Unit tests for all service methods
- Integration tests for API endpoints
- Load tests for performance validation

## Support
For support or questions about the KoraPay integration, please contact:
- Email: support@trustbank.tech
- Documentation: https://docs.trustbank.tech 