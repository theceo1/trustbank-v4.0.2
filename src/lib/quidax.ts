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

export class QuidaxService {
  protected baseUrl: string;
  protected secretKey?: string;
  protected publicKey: string;

  constructor(baseUrl = QUIDAX_API_URL, secretKey?: string, publicKey = QUIDAX_PUBLIC_KEY) {
    this.baseUrl = baseUrl;
    this.secretKey = secretKey;
    this.publicKey = publicKey;
  }

  async getMarketTickers() {
    return this.request('/markets/tickers', {}, false);
  }

  async request(endpoint: string, options: RequestInit = {}, requiresAuth = true) {
    try {
      console.log('[QuidaxService] Making request:', {
        url: `${this.baseUrl}${endpoint}`,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body as string) : undefined,
        hasSecretKey: !!this.secretKey,
        requiresAuth
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };

      if (requiresAuth) {
        if (!this.secretKey) {
          console.error('[QuidaxService] No secret key provided for authenticated endpoint');
          throw new Error('Secret key is required for authenticated endpoints');
        }
        headers['Authorization'] = `Bearer ${this.secretKey}`;
      } else {
        headers['Authorization'] = `Bearer ${this.publicKey}`;
      }

      // Add timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();
        console.log('[QuidaxService] Raw response:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText.substring(0, 1000) // Log first 1000 chars to avoid huge logs
        });

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('[QuidaxService] Failed to parse response as JSON:', {
            error: e,
            responseText: responseText.substring(0, 1000)
          });
          throw new Error(`Invalid response format from API: ${responseText.substring(0, 100)}`);
        }

        // Check for API-specific error responses
        if (data.status === 'error' || data.error) {
          console.error('[QuidaxService] API returned error:', {
            status: response.status,
            endpoint,
            error: data.error || data.message
          });
          
          const error = new Error(data.message || data.error || 'API returned an error response');
          (error as any).response = { 
            status: response.status, 
            data,
            statusText: response.statusText
          };
          throw error;
        }

        if (!response.ok) {
          console.error('[QuidaxService] Request failed:', {
            status: response.status,
            statusText: response.statusText,
            endpoint,
            data
          });
          
          const error = new Error(data.message || data.error || 'Request failed');
          (error as any).response = { 
            status: response.status, 
            data,
            statusText: response.statusText
          };
          throw error;
        }

        // For successful responses, ensure we have the expected structure
        if (!data || (typeof data === 'object' && !('data' in data) && !('status' in data))) {
          console.error('[QuidaxService] Invalid response structure:', {
            endpoint,
            data: JSON.stringify(data, null, 2)
          });
          throw new Error('Invalid response structure from API');
        }

        return data;
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new Error('Request timed out after 30 seconds');
        }
        throw error;
      }
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
    const response = await quidaxApi.get(`/markets/${market}/order_book`);
    return response.data;
  }

  // Add other methods from QuidaxService class here...
}

// Export a singleton instance for client-side usage
export const quidaxService = new QuidaxService();

// Helper to create server-side instance
export function createQuidaxServer(secretKey: string) {
  return new QuidaxServerService(secretKey);
}

// Server-side service that uses the secret key
export class QuidaxServerService extends QuidaxService {
  constructor(secretKey: string) {
    super(QUIDAX_API_URL, secretKey);
  }

  async getWallets(userId: string) {
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