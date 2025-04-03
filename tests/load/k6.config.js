import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const marketTickerErrors = new Rate('market_ticker_errors');
const orderBookErrors = new Rate('order_book_errors');

// Test user credentials - should match a test account in your database
const TEST_USER = {
  email: 'test1735848851306@trustbank.tech',
  password: 'trustbank123'
};

// Default headers for all requests
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

export const options = {
  scenarios: {
    // Test market tickers endpoint
    market_tickers: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },     // Warm up
        { duration: '30s', target: 10 },    // Gradual increase
        { duration: '30s', target: 15 },    // Medium load
        { duration: '30s', target: 20 },    // High load
        { duration: '30s', target: 25 },    // Peak load
        { duration: '30s', target: 0 },     // Scale down
      ],
      exec: 'marketTickersFlow'
    },

    // Test order book endpoint
    order_book: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },     // Warm up
        { duration: '30s', target: 10 },    // Gradual increase
        { duration: '30s', target: 15 },    // Medium load
        { duration: '30s', target: 20 },    // High load
        { duration: '30s', target: 25 },    // Peak load
        { duration: '30s', target: 0 },     // Scale down
      ],
      exec: 'orderBookFlow'
    }
  },

  thresholds: {
    http_req_duration: [
      'p(95)<2000',  // 95% of requests should be below 2s
      'p(99)<3000'   // 99% of requests should be below 3s
    ],
    http_req_failed: ['rate<0.01'],        // Less than 1% failure rate
    market_ticker_errors: ['rate<0.01'],    // Less than 1% market ticker errors
    order_book_errors: ['rate<0.01']        // Less than 1% order book errors
  }
};

// Market tickers endpoint test
export function marketTickersFlow() {
  const params = {
    headers,
    timeout: '5s',  // Increased timeout
    tags: { type: 'market_tickers' }
  };

  group('Market Tickers Test', () => {
    const markets = ['btcusdt', 'ethusdt', 'usdtngn'];
    
    for (const market of markets) {
      const tickersRes = http.get(
        `${__ENV.BASE_URL}/api/markets/${market}/ticker`,
        params
      );
      
      const success = check(tickersRes, {
        'status is 200': (r) => r.status === 200,
        'has valid data': (r) => {
          try {
            const data = JSON.parse(r.body);
            return data.status === 'success' && data.data;
          } catch {
            return false;
          }
        },
        'response time OK': (r) => r.timings.duration < 2000
      });

      if (!success) {
        marketTickerErrors.add(1);
        console.log(`Market tickers failed for ${market} - Status: ${tickersRes.status}, Duration: ${tickersRes.timings.duration}ms`);
      }
      
      sleep(1);  // 1s between requests
    }
  });
}

// Order book endpoint test
export function orderBookFlow() {
  const params = {
    headers,
    timeout: '3s',  // Reduced timeout
    tags: { type: 'order_book' }
  };

  group('Order Book Test', () => {
    const markets = ['btcusdt', 'ethusdt', 'usdtngn'];
    
    for (const market of markets) {
      const orderBookRes = http.get(
        `${__ENV.BASE_URL}/api/markets/${market}/order-book`,
        params
      );
      
      const success = check(orderBookRes, {
        'status is 200': (r) => r.status === 200,
        'has valid data': (r) => {
          try {
            const data = JSON.parse(r.body);
            return data.asks && data.bids;
          } catch {
            return false;
          }
        },
        'response time OK': (r) => r.timings.duration < 1000
      });

      if (!success) {
        orderBookErrors.add(1);
        console.log(`Order book failed for ${market} - Status: ${orderBookRes.status}, Duration: ${orderBookRes.timings.duration}ms`);
      }
      
      sleep(1);  // 1s between requests
    }
  });
} 