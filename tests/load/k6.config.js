import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

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
    // Simulate constant background traffic
    background_traffic: {
      executor: 'constant-vus',
      vus: 5,
      duration: '5m',
      exec: 'backgroundFlow'
    },

    // Simulate active traders checking prices frequently
    active_traders: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },    // Ramp up to 10 users
        { duration: '2m', target: 10 },    // Stay at 10 for 2 minutes
        { duration: '1m', target: 15 },    // Ramp up to peak
        { duration: '1m', target: 5 },     // Scale down
      ],
      exec: 'activeTraderFlow'
    },

    // Simulate periodic spikes (e.g., market events)
    traffic_spikes: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 30,
      stages: [
        { duration: '30s', target: 5 },    // Warm up
        { duration: '1m', target: 15 },    // Medium load
        { duration: '30s', target: 25 },   // Peak traffic
        { duration: '2m', target: 10 },    // Sustained load
        { duration: '1m', target: 5 },     // Cool down
      ],
      exec: 'spikeFlow'
    }
  },

  thresholds: {
    http_req_duration: [
      'p(95)<1500',  // 95% of requests should be below 1.5s
      'p(99)<2500'   // 99% of requests should be below 2.5s
    ],
    http_req_failed: ['rate<0.02'],  // Less than 2% failure rate
    errors: ['rate<0.02'],           // Less than 2% custom error rate
  }
};

// Background traffic - casual users checking prices
export function backgroundFlow() {
  const params = {
    headers,
    timeout: '5s',
    tags: { type: 'background' }
  };

  group('Market Overview', () => {
    // Get market tickers with retry logic
    const maxRetries = 2;
    let retries = 0;
    let success = false;

    while (!success && retries <= maxRetries) {
      const tickersRes = http.get(
        `${__ENV.BASE_URL}/api/markets/tickers`,
        params
      );
      
      success = check(tickersRes, {
        'tickers status is 200': (r) => r.status === 200,
        'tickers has valid data': (r) => {
          try {
            const data = JSON.parse(r.body);
            return data.status === 'success' && data.data;
          } catch {
            return false;
          }
        }
      });

      if (!success && retries < maxRetries) {
        sleep(1); // Wait 1s before retry
        retries++;
      }
    }
    
    if (!success) {
      errorRate.add(1);
    }
    
    sleep(Math.random() * 2 + 3); // Random sleep 3-5 seconds
  });
}

// Active trader behavior
export function activeTraderFlow() {
  const params = {
    headers,
    timeout: '5s',
    tags: { type: 'active_trader' }
  };

  group('Trading Activity', () => {
    // Check multiple markets with retry logic
    const markets = ['btcusdt', 'ethusdt', 'usdtngn'];
    
    for (const market of markets) {
      let success = false;
      let retries = 0;
      
      while (!success && retries <= 2) {
        const orderBookRes = http.get(
          `${__ENV.BASE_URL}/api/markets/${market}/order-book`,
          params
        );
        
        success = check(orderBookRes, {
          'order book status is 200': (r) => r.status === 200,
          'order book has valid data': (r) => {
            try {
              const data = JSON.parse(r.body);
              return data.asks && data.bids;
            } catch {
              return false;
            }
          }
        });

        if (!success && retries < 2) {
          sleep(1);
          retries++;
        }
      }
      
      if (!success) {
        errorRate.add(1);
      }
      
      // Quick check of tickers between order books
      http.get(`${__ENV.BASE_URL}/api/markets/tickers`, params);
      
      sleep(1); // 1s between requests
    }
    
    sleep(Math.random() * 2 + 2); // Random sleep 2-4 seconds between cycles
  });
}

// Spike traffic simulation
export function spikeFlow() {
  const params = {
    headers,
    timeout: '5s',
    tags: { type: 'spike' }
  };

  group('High Frequency Updates', () => {
    // Sequential requests instead of parallel to reduce load
    const endpoints = [
      `${__ENV.BASE_URL}/api/markets/tickers`,
      `${__ENV.BASE_URL}/api/markets/usdtngn/order-book`,
      `${__ENV.BASE_URL}/api/markets/btcusdt/order-book`
    ];
    
    for (const endpoint of endpoints) {
      let success = false;
      let retries = 0;
      
      while (!success && retries <= 2) {
        const res = http.get(endpoint, params);
        
        success = check(res, {
          'status is 200': (r) => r.status === 200,
          'has valid data': (r) => {
            try {
              return JSON.parse(r.body);
            } catch {
              return false;
            }
          }
        });

        if (!success && retries < 2) {
          sleep(1);
          retries++;
        }
      }
      
      if (!success) {
        errorRate.add(1);
        console.log(`Request to ${endpoint} failed after retries`);
      }
      
      sleep(0.5); // 500ms between requests
    }
  });
} 