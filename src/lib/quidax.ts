import axios from 'axios';
import { cookies } from 'next/headers';

const QUIDAX_API_URL = (process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1') as string;
const QUIDAX_PUBLIC_KEY = process.env.NEXT_PUBLIC_QUIDAX_PUBLIC_KEY || '';

// Configure a single axios instance for client-side requests
const quidaxApi = axios.create({
  baseURL: QUIDAX_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Client-side service that uses the public key
export class QuidaxClientService {
  constructor() {
    if (!QUIDAX_PUBLIC_KEY) {
      console.warn('QUIDAX_PUBLIC_KEY is not set. Some features may be limited.');
    }
    
    quidaxApi.interceptors.request.use(config => {
      config.headers.Authorization = `Bearer ${QUIDAX_PUBLIC_KEY}`;
      return config;
    });
  }

  // Client-side methods that only need public key
  async getMarketTickers() {
    const response = await quidaxApi.get('/tickers');
    return response.data;
  }

  async getOrderBook(market: string) {
    const response = await quidaxApi.get(`/markets/${market}/order_book`);
    return response.data;
  }
}

// Server-side service that uses the secret key
export class QuidaxServerService {
  private secretKey: string;

  constructor(secretKey: string) {
    if (!secretKey) {
      throw new Error('QUIDAX_SECRET_KEY is required');
    }
    this.secretKey = secretKey;
  }

  // Add getMarketTickers method
  async getMarketTickers() {
    return this.request('/markets/tickers');
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${QUIDAX_API_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Quidax API error:', {
          status: response.status,
          statusText: response.statusText,
          url,
          response: text
        });
        throw new Error(`Quidax API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Quidax request failed:', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Server-side methods that need secret key
  async createSubAccount(email: string, firstName: string, lastName: string) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName
      })
    });
  }

  async getSubAccount(userId: string) {
    return this.request(`/users/${userId}`);
  }

  async getWallets(userId: string) {
    return this.request(`/users/${userId}/wallets`);
  }

  async createSwapQuotation(userId: string, params: {
    from_currency: string;
    to_currency: string;
    from_amount: string;
  }) {
    return this.request(`/users/${userId}/swap_quotation`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async confirmSwapQuotation(userId: string, quotationId: string) {
    return this.request(`/users/${userId}/swap_quotation/${quotationId}/confirm`, {
      method: 'POST'
    });
  }

  // Withdrawals
  async createWithdrawal(userId: string, params: {
    currency: string;
    amount: string;
    address: string;
  }) {
    return this.request(`/users/${userId}/withdraws`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Wallet addresses
  async getWalletAddress(userId: string, currency: string, network: string) {
    return this.request(`/users/${userId}/wallets/${currency}/addresses?network=${network}`);
  }

  async createWalletAddress(userId: string, currency: string, network: string) {
    return this.request(`/users/${userId}/wallets/${currency}/addresses`, {
      method: 'POST',
      body: JSON.stringify({ network })
    });
  }
}

// Export a singleton instance for client-side usage
export const quidaxClient = new QuidaxClientService();

// Helper to create server-side instance
export function createQuidaxServer(secretKey: string) {
  return new QuidaxServerService(secretKey);
}

export async function fetchQuidaxData(endpoint: string) {
  try {
    const response = await quidaxApi.get(endpoint);
    return response.data.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error('Quidax API error:', { endpoint, error: errorMessage });
    throw new Error(`Quidax API error: ${errorMessage}`);
  }
}

export async function getWallets(userId: string = 'me') {
  return fetchQuidaxData(`/users/${userId}/wallets`);
}

export async function getMarketTickers() {
  return fetchQuidaxData('/markets/tickers');
}

export async function getSwapTransactions(userId: string = 'me') {
  return fetchQuidaxData(`/users/${userId}/swap_transactions`);
}

interface SwapQuotation {
  id: string;
  from_currency: string;
  to_currency: string;
  quoted_price: string;
  quoted_currency: string;
  from_amount: string;
  to_amount: string;
  confirmed: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    sn: string;
    email: string;
    reference: string | null;
    first_name: string;
    last_name: string;
    display_name: string;
    created_at: string;
    updated_at: string;
  };
}

export interface SwapTransaction {
  id: string;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  received_amount: string;
  execution_price: string;
  status: string;
  created_at: string;
  updated_at: string;
  swap_quotation: SwapQuotation;
  user?: QuidaxUser;
}

export interface QuidaxUser {
  id: string;
  sn: string;
  email: string;
  reference: string | null;
  first_name: string;
  last_name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface QuidaxWallet {
  id: string;
  currency: string;
  balance: string;
  locked: string;
  address?: string;
  tag?: string;
}

export interface WithdrawalRequest {
  id: string;
  currency: string;
  amount: string;
  fee: string;
  status: string;
  address: string;
  created_at: string;
  updated_at: string;
}

interface MarketTicker {
  ticker: {
    buy: string;
    sell: string;
    low: string;
    high: string;
    open: string;
    last: string;
    vol: string;
  };
}

interface QuidaxResponse<T> {
  status: string;
  data: T;
}

export interface MarketTickers {
  [key: string]: MarketTicker;
}

interface CreateOrderParams {
  market: string;
  side: 'buy' | 'sell';
  ord_type: 'limit' | 'market';
  price?: string;
  volume: string;
  user_id: string;
}

interface Order {
  id: string;
  market: string;
  side: string;
  ord_type: string;
  price: string;
  volume: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export class QuidaxService {
  private baseUrl: string;
  private secretKey?: string;

  constructor(baseUrl = QUIDAX_API_URL, secretKey?: string) {
    this.baseUrl = baseUrl;
    this.secretKey = secretKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${QUIDAX_API_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Quidax API error:', {
          status: response.status,
          statusText: response.statusText,
          url,
          response: text
        });
        throw new Error(`Quidax API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Quidax request failed:', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Sub-account management
  async createSubAccount(email: string, firstName: string, lastName: string) {
    try {
      // Create the sub-account
      const response = await this.request('/users', {
        method: 'POST',
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName
        })
      });

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!response?.data?.sn || !uuidRegex.test(response.data.sn)) {
        throw new Error('Invalid sub-account ID returned from Quidax');
      }

      // Wait for the sub-account to be ready
      let retries = 10;
      let lastError = null;
      
      while (retries > 0) {
        try {
          // Verify the sub-account exists
          const verifyResponse = await this.request(`/users/${response.data.sn}`);
          
          // If we get a response with the same sn, consider it a success
          if (verifyResponse?.data?.sn === response.data.sn) {
            console.log('Sub-account verified successfully:', response.data.sn);
            return response;
          }
        } catch (error: any) {
          lastError = error;
          console.log(`Waiting for sub-account ${response.data.sn} to be ready... (${retries} retries left)`);
          console.log('Verification error:', error.message);
        }
        
        // Wait 3 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 3000));
        retries--;
      }

      throw new Error(`Failed to verify sub-account ${response.data.sn}. Last error: ${lastError?.message || 'Unknown error'}`);
    } catch (error: any) {
      // If the error is from the initial creation
      if (error.message.includes('Invalid sub-account ID')) {
        throw error;
      }
      
      // For other errors, provide more context
      throw new Error(`Error in sub-account creation/verification: ${error.message}`);
    }
  }

  async getSubAccount(userId: string) {
    return this.request(`/users/${userId}`);
  }

  // Wallet management
  async getWallets(userId: string) {
    return this.request(`/users/${userId}/wallets`);
  }

  async getWallet(userId: string, currency: string) {
    return this.request(`/users/${userId}/wallets/${currency}`);
  }

  async createPaymentAddress(userId: string, currency: string, network?: string) {
    return this.request(`/users/${userId}/wallets/${currency}/addresses`, {
      method: 'POST',
      body: JSON.stringify({ network })
    });
  }

  // Instant swap
  async createSwapQuotation(userId: string, params: {
    from_currency: string;
    to_currency: string;
    from_amount: string;
  }) {
    return this.request(`/users/${userId}/swap_quotation`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async confirmSwapQuotation(userId: string, quotationId: string) {
    return this.request(`/users/${userId}/swap_quotation/${quotationId}/confirm`, {
      method: 'POST'
    });
  }

  async refreshSwapQuotation(userId: string, quotationId: string, params: {
    from_currency: string;
    to_currency: string;
    from_amount: string;
  }) {
    return this.request(`/users/${userId}/swap_quotation/${quotationId}/refresh`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async getSwapTransaction(userId: string, swapId: string) {
    return this.request(`/users/${userId}/swap_transactions/${swapId}`);
  }

  async getSwapTransactions(userId: string) {
    return this.request(`/users/${userId}/swap_transactions`);
  }

  async getTemporarySwapQuotation(userId: string, params: {
    from_currency: string;
    to_currency: string;
    from_amount: string;
  }) {
    return this.request(`/users/${userId}/temporary_swap_quotation`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Internal transfers
  async transferToSubAccount(mainAccountId: string, params: {
    currency: string;
    amount: string;
    fund_uid: string;
    transaction_note?: string;
    narration?: string;
  }) {
    return this.request(`/users/${mainAccountId}/withdraws`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async transferToMainAccount(subAccountId: string, params: {
    currency: string;
    amount: string;
    fund_uid: string;
    transaction_note?: string;
    narration?: string;
  }) {
    return this.request(`/users/${subAccountId}/withdraws`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Market data
  async getMarketQuote(params: {
    market: string;
    unit: string;
    kind: 'ask' | 'bid';
    volume: string;
  }) {
    const query = new URLSearchParams(params);
    return this.request(`/quotes?${query}`);
  }

  async getOrderBook(currency: string, askLimit = 20, bidsLimit = 20) {
    const query = new URLSearchParams({
      ask_limit: askLimit.toString(),
      bids_limit: bidsLimit.toString()
    });
    return this.request(`/markets/${currency}/order_book?${query}`);
  }

  // Withdrawals
  async createWithdrawal(userId: string, params: {
    currency: string;
    amount: string;
    address: string;
  }) {
    return this.request(`/users/${userId}/withdraws`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Wallet addresses
  async createWalletAddress(userId: string, currency: string, network: string) {
    return this.request(`/users/${userId}/wallets/${currency}/addresses`, {
      method: 'POST',
      body: JSON.stringify({ network })
    });
  }

  async getWalletAddress(userId: string, currency: string, network: string) {
    return this.request(`/users/${userId}/wallets/${currency}/addresses?network=${network}`);
  }
}

// Export a singleton instance for client-side usage (no secret key)
export const quidaxService = new QuidaxService(); 