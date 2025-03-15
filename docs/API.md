# trustBank API Documentation

## Base URL

Production: `https://api.trustBank.com`
Development: `http://localhost:3000/api`

## Authentication

All API requests require authentication using a Bearer token:

```bash
Authorization: Bearer <token>
```

## Rate Limiting

- Standard rate limit: 10 requests per 10 seconds
- KYC verification: 3 attempts per hour
- 2FA verification: 3 attempts per 5 minutes

## Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

Request:
```json
{
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
```

#### POST /auth/2fa/setup
Initialize 2FA setup.

Response:
```json
{
  "secret": "string",
  "qrCode": "string"
}
```

### KYC Verification

#### POST /kyc/verify/nin
Verify NIN with selfie.

Request:
```json
{
  "nin": "string",
  "selfieImage": "base64",
  "firstName": "string",
  "lastName": "string"
}
```

#### POST /kyc/verify/bvn
Verify BVN.

Request:
```json
{
  "bvn": "string",
  "firstName": "string",
  "lastName": "string",
  "dob": "string"
}
```

### Wallet Operations

#### GET /wallet/balance
Get wallet balances.

Response:
```json
{
  "wallets": [
    {
      "currency": "string",
      "balance": "number",
      "address": "string"
    }
  ]
}
```

#### POST /wallet/withdraw
Initiate withdrawal (requires 2FA).

Request:
```json
{
  "currency": "string",
  "amount": "number",
  "address": "string",
  "twoFactorCode": "string"
}
```

### P2P Trading

#### GET /trades/p2p/orders
Get P2P orders.

Query Parameters:
- `currency`: string
- `type`: "buy" | "sell"
- `page`: number
- `limit`: number

#### POST /trades/p2p/orders
Create P2P order.

Request:
```json
{
  "type": "buy" | "sell",
  "currency": "string",
  "amount": "number",
  "price": "number",
  "payment_methods": [
    {
      "type": "string",
      "details": "string"
    }
  ]
}
```

### Market Data

#### GET /market/tickers
Get market tickers.

Response:
```json
{
  "tickers": {
    "BTC": {
      "last": "number",
      "high": "number",
      "low": "number",
      "volume": "number",
      "change_24h": "number"
    }
  }
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

Error Response Format:
```json
{
  "status": "error",
  "message": "string",
  "code": "string"
}
```

## Webhooks

### KYC Verification Webhook
Endpoint: `/webhooks/kyc`

Payload:
```json
{
  "event": "kyc_verification",
  "status": "completed" | "failed",
  "user_id": "string",
  "verification_id": "string",
  "data": {}
}
```

## Testing

Test credentials:
- API Key: `test_key_xxxxx`
- Test BVN: `12345678901`
- Test NIN: `12345678901` 