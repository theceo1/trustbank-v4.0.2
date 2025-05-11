import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { cookies } from 'next/headers';

type QuidaxRequestOptions = {
  retries?: number;
  timeout?: number;
  circuitBreaker?: boolean;
};

export interface SwapQuotationRequest {
  from_currency: string;
  to_currency: string;
  from_amount: string;
}

export interface SwapTransaction {
  id: string;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  received_amount: string;
  status: string;
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
  status?: string;
  created_at: string;
  updated_at: string;
  last_transaction_at?: string;
  deposit_address?: string;
  destination_tag?: string;
  default_network?: string;
  blockchain_enabled?: boolean;
  networks?: {
    id: string;
    name: string;
    deposits_enabled: boolean;
    withdraws_enabled: boolean;
  }[];
}

export interface SubAccount {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  metadata?: {
    source?: string;
    provider_id?: string;
    email_verified?: boolean;
  };
}

export interface QuidaxWalletAddress {
  address: string;
  tag?: string;
  network?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

const QUIDAX_API_URL = (process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1') as string;
const QUIDAX_PUBLIC_KEY = process.env.NEXT_PUBLIC_QUIDAX_PUBLIC_KEY || '';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

// Configure a single axios instance for client-side requests
const quidaxApi = axios.create({
  baseURL: QUIDAX_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

export class QuidaxService {
  protected client: AxiosInstance;
  protected baseUrl: string;
  private lastFailureTime: number | null = null;
  private failureCount = 0;
  private readonly maxRetries = 3;
  private readonly circuitBreakerThreshold = 5;
  private readonly circuitBreakerTimeout = 30000; // 30 seconds

  constructor(secretKey: string = QUIDAX_SECRET_KEY!, baseUrl: string = QUIDAX_API_URL) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status >= 500) {
          this.failureCount++;
          this.lastFailureTime = Date.now();
        }
        return Promise.reject(error);
      }
    );
  }

  private async requestWithRetry<T>(endpoint: string, config: AxiosRequestConfig, options: QuidaxRequestOptions = {}): Promise<T> {
  // Log the request endpoint and config for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Quidax] API Request:', { endpoint, config });
  }
    const { retries = this.maxRetries, timeout = 10000, circuitBreaker = true } = options;
    
    // Check circuit breaker
    if (circuitBreaker && this.failureCount >= this.circuitBreakerThreshold && 
        this.lastFailureTime && (Date.now() - this.lastFailureTime) < this.circuitBreakerTimeout) {
      throw new Error('Quidax API is temporarily unavailable due to multiple failures');
    }

    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await Promise.race([
          this.client.request({ ...config, url: endpoint }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]) as AxiosResponse<{ status: string; message?: string; data: T }>;
        
        // Reset failure count on success
        if (attempt > 0) {
          this.failureCount = 0;
          this.lastFailureTime = null;
        }
        
        if (response.data.status === 'error') {
          throw new Error(response.data.message || 'Quidax API error');
        }
        return response.data.data;
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }

  // Wallet Operations
  async getWallets(userId: string = 'me'): Promise<QuidaxWallet[]> {
    return this.requestWithRetry(`/users/${userId}/wallets`, { method: 'GET' });
  }

  async getWallet(userId: string, currency: string): Promise<QuidaxWallet> {
    return this.requestWithRetry(`/users/${userId}/wallets/${currency}`, { method: 'GET' });
  }

  async createWalletAddress(userId: string, currency: string, network?: string): Promise<QuidaxWalletAddress> {
    const url = network ? 
      `/users/${userId}/wallets/${currency}/addresses?network=${network}` :
      `/users/${userId}/wallets/${currency}/addresses`;
    return this.requestWithRetry(url, { method: 'POST' });
  }

  // Swap Operations
  async createSwapQuotation(userId: string, params: SwapQuotationRequest): Promise<any> {
    return this.requestWithRetry(`/users/${userId}/swap_quotation`, {
      method: 'POST',
      data: params
    });
  }

  async confirmSwapQuotation(userId: string, quotationId: string): Promise<SwapTransaction> {
    try {
      return await this.requestWithRetry(`/users/${userId}/swap_quotation/${quotationId}/confirm`, {
        method: 'POST'
      });
    } catch (error: any) {
      // Log the request details and error for debugging
      console.error('[Quidax] Swap confirmation failed:', {
        userId,
        quotationId,
        error: error?.response?.data || error?.message || error
      });
      throw error;
    }
  }

  async getSwapTransactions(userId: string = 'me', from?: string): Promise<SwapTransaction[]> {
    return this.requestWithRetry(`/users/${userId}/swap_transactions`, { 
      method: 'GET',
      params: {
        per_page: 100,
        ...(from && { from })
      }
    });
  }

  // Sub-Account Operations
  async getSubAccounts(): Promise<SubAccount[]> {
    return this.requestWithRetry('/users', { 
      method: 'GET',
      params: {
        per_page: 100 // Get max allowed results
      }
    });
  }

  async getSubAccount(userId: string): Promise<SubAccount> {
    return this.requestWithRetry(`/users/${userId}`, { 
      method: 'GET'
    });
  }

  async createSubAccount(params: {
    email: string;
    first_name: string;
    last_name: string;
    display_name?: string;
    metadata?: {
      source?: string;
      provider_id?: string;
      email_verified?: boolean;
    };
  }): Promise<SubAccount> {
    return this.requestWithRetry('/users', {
      method: 'POST',
      data: {
        ...params,
        display_name: params.display_name || `${params.first_name} ${params.last_name}`
      }
    });
  }

  async deleteSubAccount(subAccountId: string): Promise<void> {
    const response = await this.client.delete(`/sub_accounts/${subAccountId}`);
    return response.data;
  }

  // Market Data
  async getOrderBook(market: string, askLimit = 20, bidsLimit = 20): Promise<any> {
    return this.requestWithRetry(`/markets/${market}/order_book?ask_limit=${askLimit}&bids_limit=${bidsLimit}`, {
      method: 'GET'
    });
  }

  async getMarketTickers(): Promise<any> {
    return this.requestWithRetry('/markets/tickers', { method: 'GET' });
  }

  // Helper method for backward compatibility
  async request(endpoint: string, config: AxiosRequestConfig = { method: 'GET' }) {
    if (!config.method) {
      config.method = 'GET';
    }
    return this.requestWithRetry(endpoint, {
      ...config,
      method: config.method // Ensure method is always defined
    }, {
      circuitBreaker: false // Disable circuit breaker for legacy requests
    });
  }
}

// Export a singleton instance for client-side usage
export const quidaxService = new QuidaxService();

// Helper to create server-side instance
export function createQuidaxServer(secretKey: string = QUIDAX_SECRET_KEY!, baseUrl: string = QUIDAX_API_URL) {
  if (!secretKey) {
    throw new Error('QUIDAX_SECRET_KEY is not configured');
  }
  return new QuidaxService(secretKey, baseUrl);
}