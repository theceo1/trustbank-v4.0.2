import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp up to 10 users
    { duration: '3m', target: 10 }, // Stay at 10 users
    { duration: '1m', target: 20 }, // Ramp up to 20 users
    { duration: '3m', target: 20 }, // Stay at 20 users
    { duration: '1m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    errors: ['rate<0.1'], // Error rate should be below 10%
  },
};

// Test data
const testAccount = {
  bankCode: '044',
  accountNumber: '1234567890',
};

const testTransfer = {
  amount: 1000,
  currency: 'NGN',
  bankCode: '044',
  accountNumber: '1234567890',
  accountName: 'Test User',
  narration: 'Load test transfer',
};

// Test functions
export function setup() {
  // Setup code (if needed)
  return {};
}

export default function (data) {
  // Test account verification
  const verifyResponse = http.post(
    'http://localhost:3000/api/payments/korapay/verify',
    JSON.stringify(testAccount),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(verifyResponse, {
    'verify status is 200': (r) => r.status === 200,
    'verify response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  errorRate.add(verifyResponse.status !== 200);

  // Test transfer initiation
  const transferResponse = http.post(
    'http://localhost:3000/api/payments/korapay/transfer',
    JSON.stringify(testTransfer),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(transferResponse, {
    'transfer status is 200': (r) => r.status === 200,
    'transfer response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  errorRate.add(transferResponse.status !== 200);

  // Test bank list retrieval
  const banksResponse = http.get('http://localhost:3000/api/payments/korapay/banks');

  check(banksResponse, {
    'banks status is 200': (r) => r.status === 200,
    'banks response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  errorRate.add(banksResponse.status !== 200);

  sleep(1);
} 