import axios, { AxiosInstance } from 'axios';
import { cookies } from 'next/headers';

const QUIDAX_API_URL = (process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1') as string;
const QUIDAX_PUBLIC_KEY = process.env.NEXT_PUBLIC_QUIDAX_PUBLIC_KEY || '';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

// Configure a single axios instance for client-side requests
const quidaxApi = axios.create({
  baseURL: QUIDAX_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

export class QuidaxService {
  protected client: AxiosInstance;

  constructor(secretKey: string = QUIDAX_SECRET_KEY!) {
    this.client = axios.create({
      baseURL: QUIDAX_API_URL,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async get(endpoint: string, config = {}) {
    const response = await this.client.get(endpoint, config);
    return response.data;
  }

  async post(endpoint: string, data = {}, config = {}) {
    const response = await this.client.post(endpoint, data, config);
    return response.data;
  }

  async getWallets() {
    return this.request('/wallets');
  }

  async getMarketTicker(market: string) {
    return this.request(`/markets/${market}/ticker`);
  }

  async getTrades(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/trades${queryString ? `?${queryString}` : ''}`);
  }

  async getMarketTickers() {
    return this.request('/markets/tickers');
  }

  async request(endpoint: string, options: RequestInit = {}, requiresAuth = true) {
    try {
      console.log('[QuidaxService] Making request:', {
        url: `${QUIDAX_API_URL}${endpoint}`,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body as string) : undefined,
        hasSecretKey: !!this.client.defaults.headers.Authorization,
        requiresAuth
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };

      if (requiresAuth) {
        if (!this.client.defaults.headers.Authorization) {
          console.error('[QuidaxService] No secret key provided for authenticated endpoint');
          throw new Error('Secret key is required for authenticated endpoints');
        }
        headers['Authorization'] = String(this.client.defaults.headers.Authorization);
      }

      const response = await fetch(`${QUIDAX_API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const responseText = await response.text();
      console.log('[QuidaxService] Raw response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('[QuidaxService] Failed to parse response as JSON:', {
          error,
          responseText
        });
        throw new Error('Invalid response format from API: ' + responseText.substring(0, 50));
      }

      // Check for error responses
      if (!response.ok || data.status === 'error') {
        const errorMessage = data.message || data.error || 'Unknown error occurred';
        const error = new Error(errorMessage);
        (error as any).response = {
          status: response.status,
          data,
          statusText: response.statusText
        };
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('[QuidaxService] Request error:', {
        endpoint,
        method: options.method || 'GET',
        error: error.message || error,
        response: error.response,
        stack: error.stack
      });

      // Enhance error with more context
      const enhancedError = new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'An error occurred while making the request'
      );
      (enhancedError as any).response = error.response;
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  }

  async getOrderBook(market: string) {
    return this.request(`/markets/${market}/order_book`);
  }

  // Add other methods from QuidaxService class here...
}

// Export a singleton instance for client-side usage
export const quidaxService = new QuidaxService();

// Helper to create server-side instance
export function createQuidaxServer(secretKey: string = QUIDAX_SECRET_KEY!) {
  if (!secretKey) {
    throw new Error('QUIDAX_SECRET_KEY is not configured');
  }
  return new QuidaxService(secretKey);
}

// Server-side service that uses the secret key
export class QuidaxServerService extends QuidaxService {
  constructor(secretKey: string) {
    super(secretKey);
  }

  async getUserWallets(userId: string) {
    return this.request(`/users/${userId}/wallets`);
  }

  async createSwapQuotation(userId: string, params: SwapQuotationRequest) {
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

  async refreshSwapQuotation(userId: string, quotationId: string, request: SwapQuotationRequest) {
    return this.request(`/users/${userId}/swap_quotation/${quotationId}/refresh`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async getTemporarySwapQuotation(userId: string, request: SwapQuotationRequest) {
    return this.request(`/users/${userId}/temporary_swap_quotation`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async getSwapTransactions(userId: string) {
    return this.request(`/users/${userId}/swap_transactions`);
  }

  async getSwapTransaction(userId: string, transactionId: string) {
    return this.request(`/users/${userId}/swap_transactions/${transactionId}`);
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
  async getWalletAddress(userId: string, currency: string) {
    return this.request(`/users/${userId}/wallets/${currency}/address`);
  }

  async createWalletAddress(userId: string, currency: string, network: string) {
    return this.request(`/users/${userId}/wallets/${currency}/addresses?network=${network}`, {
      method: 'POST'
    });
  }

  async getWalletAddresses(userId: string, currency: string) {
    return this.request(`/users/${userId}/wallets/${currency}/addresses`);
  }
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

interface SwapQuotationRequest {
  from_currency: string;
  to_currency: string;
  from_amount: string;
}

interface SwapQuotationResponse {
  id: string;
  from_currency: string;
  to_currency: string;
  quoted_price: string;
  quoted_currency: string;
  from_amount: string;
  to_amount: string;
  confirmed: boolean;
  expires_at: string;
}

export function getQuidaxClient() {
  const secretKey = process.env.QUIDAX_SECRET_KEY;

  if (!secretKey) {
    throw new Error('QUIDAX_SECRET_KEY is not set in environment variables');
  }

  return axios.create({
    baseURL: 'https://www.quidax.com/api/v1',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });
}