import axios from 'axios';
import { cookies } from 'next/headers';

const QUIDAX_API_URL = process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;
const QUIDAX_PUBLIC_KEY = process.env.NEXT_PUBLIC_QUIDAX_PUBLIC_KEY;

// Configure a single axios instance for client-side requests
const quidaxApi = axios.create({
  baseURL: QUIDAX_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add authentication interceptor
quidaxApi.interceptors.request.use(config => {
  if (!QUIDAX_SECRET_KEY) {
    throw new Error('QUIDAX_SECRET_KEY is not configured');
  }
  
  config.headers.Authorization = `Bearer ${QUIDAX_SECRET_KEY}`;
  return config;
});

// Add Cloudflare error interceptor
quidaxApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.data?.includes('Cloudflare')) {
      throw new Error('Quidax API is currently unavailable. Please try again later');
    }
    return Promise.reject(error);
  }
);

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
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = QUIDAX_API_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

    if (!QUIDAX_SECRET_KEY) {
      throw new Error('QUIDAX_SECRET_KEY is not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  }

  async createSubAccount(userData: { 
    email: string; 
    first_name: string; 
    last_name: string; 
  }): Promise<QuidaxUser> {
    try {
      const response = await axios.post('/api/users', userData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create sub-account');
    }
  }

  async createSwapQuotation(userId: string, data: {
    from_currency: string;
    to_currency: string;
    from_amount: string;
  }): Promise<SwapQuotation> {
    try {
      const response = await quidaxApi.post(`/users/${userId}/swap_quotation`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create swap quotation');
    }
  }

  async confirmSwapQuotation(userId: string, quotationId: string): Promise<SwapTransaction> {
    try {
      const response = await quidaxApi.post(`/users/${userId}/swap_quotation/${quotationId}/confirm`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to confirm swap quotation');
    }
  }

  async getTemporarySwapQuotation(userId: string, data: {
    from_currency: string;
    to_currency: string;
    from_amount: string;
  }): Promise<SwapQuotation> {
    try {
      const response = await axios.post('/api/markets/temporary-swap-quotation', {
        userId,
        ...data
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get swap quotation');
    }
  }

  async getUserWallets(userId: string): Promise<QuidaxWallet[]> {
    try {
      const response = await quidaxApi.get(`/users/${userId}/wallets`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  }

  async getWallet(userId: string, currency: string): Promise<QuidaxWallet> {
    const response = await quidaxApi.get(`/users/${userId}/wallets/${currency}`);
    return response.data.data;
  }

  async getWalletAddress(userId: string, currency: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/wallets/${currency}/address`, {
        headers: {
          'Authorization': `Bearer ${process.env.QUIDAX_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wallet address: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.address;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch wallet address');
    }
  }

  async createWalletAddress(userId: string, currency: string, network?: string): Promise<string> {
    try {
      const response = await quidaxApi.post(`/users/${userId}/wallets/${currency}/addresses`, { network });
      return response.data.data.id;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create wallet address');
    }
  }

  async createWithdrawal(userId: string, data: {
    currency: string;
    amount: string;
    address: string;
  }): Promise<WithdrawalRequest> {
    try {
      const response = await quidaxApi.post(`/users/${userId}/withdraws`, {
        currency: data.currency,
        amount: data.amount,
        address: data.address,
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create withdrawal request');
    }
  }

  async transferToSubAccount(currency: string, amount: string, subAccountId: string, note?: string): Promise<any> {
    try {
      const response = await quidaxApi.post('/users/me/withdraws', {
        currency,
        amount,
        fund_uid: subAccountId,
        transaction_note: note,
        narration: note,
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to transfer to sub-account');
    }
  }

  async transferToMainAccount(userId: string, currency: string, amount: string, mainAccountId: string, note?: string): Promise<any> {
    try {
      const response = await quidaxApi.post(`/users/${userId}/withdraws`, {
        currency,
        amount,
        fund_uid: mainAccountId,
        transaction_note: note,
        narration: note,
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to transfer to main account');
    }
  }

  async getMarketTickers(): Promise<Record<string, MarketTicker>> {
    try {
      const response = await axios.get<QuidaxResponse<Record<string, MarketTicker>>>(`${this.baseUrl}/markets/tickers`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching market tickers:', error);
      throw error;
    }
  }

  async getMarketRate(fromCurrency: string, toCurrency: string, userId?: string): Promise<number> {
    try {
      // For same currency, return 1
      if (fromCurrency === toCurrency) {
        return 1;
      }

      if (!userId) {
        throw new Error('Quidax user ID is required for rate calculation');
      }

      // Use temporary swap quotation for rate calculation
      try {
        const quotation = await this.getTemporarySwapQuotation(userId, {
          from_currency: fromCurrency.toLowerCase(),
          to_currency: toCurrency.toLowerCase(),
          from_amount: '1', // Request quote for 1 unit to get the rate
        });

        if (quotation && quotation.quoted_price) {
          return parseFloat(quotation.quoted_price);
        }
      } catch (error) {
        console.error('Error getting swap quotation:', error);
        throw new Error(`Cannot convert from ${fromCurrency} to ${toCurrency}. Please try a different currency pair.`);
      }
      
      throw new Error(`No market pair available for ${fromCurrency}/${toCurrency}`);
    } catch (error) {
      console.error('Error fetching market rate:', error);
      throw error;
    }
  }

  async getSwapTransactions(userId: string): Promise<SwapTransaction[]> {
    try {
      const response = await quidaxApi.get(`/users/${userId}/swap_transactions`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch swap transactions');
    }
  }

  async createOrder(params: CreateOrderParams): Promise<Order> {
    const response = await this.request(
      `/users/${params.user_id}/orders`,
      {
        method: 'POST',
        body: JSON.stringify({
          market: params.market,
          side: params.side,
          ord_type: params.ord_type,
          price: params.price,
          volume: params.volume
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create order');
    }

    const data = await response.json();
    return data.data;
  }
}

export const quidaxService = new QuidaxService(); 