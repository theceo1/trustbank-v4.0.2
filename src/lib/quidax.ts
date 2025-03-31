import axios from 'axios';
import { cookies } from 'next/headers';

const QUIDAX_API_URL = (process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://api.quidax.com/v1') as string;
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

  constructor(baseUrl = QUIDAX_API_URL, secretKey?: string) {
    this.baseUrl = baseUrl;
    this.secretKey = secretKey;
  }

  async getMarketTickers() {
    return this.request('/markets/tickers');
  }

  async request(endpoint: string, options: RequestInit = {}) {
    try {
      console.log('[QuidaxService] Making request:', {
        url: `${this.baseUrl}${endpoint}`,
        method: options.method || 'GET',
        hasSecretKey: !!this.secretKey
      });

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
          ...options.headers,
        },
      });

      const responseText = await response.text();
      console.log('[QuidaxService] Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('[QuidaxService] Failed to parse response as JSON:', e);
        throw new Error('Invalid response format from API');
      }

      if (!response.ok) {
        console.error('[QuidaxService] Request failed:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error: any) {
      console.error('[QuidaxService] Request error:', {
        endpoint,
        error: error.message || error
      });
      throw new Error(error.message || 'Failed to process request');
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