import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const KORAPAY_API_URL = process.env.KORAPAY_API_URL || 'https://api.korapay.com/merchant/api/v1';
const KORAPAY_PUBLIC_KEY = process.env.KORAPAY_PUBLIC_KEY;
const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;

if (!KORAPAY_SECRET_KEY || !KORAPAY_PUBLIC_KEY) {
  throw new Error('Korapay keys are required');
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mock data for sandbox testing
const MOCK_BANKS = [
  { code: '044', name: 'Access Bank', slug: 'access-bank' },
  { code: '033', name: 'UBA', slug: 'uba' },
  { code: '058', name: 'GTB', slug: 'gtb' },
];

export const korapayService = {
  async initiateTransfer(params: {
    amount: number;
    currency: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    narration?: string;
    reference?: string;
    userId: string;
  }) {
    try {
      const response = await fetch(`${KORAPAY_API_URL}/transactions/disburse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
        },
        body: JSON.stringify({
          reference: params.reference || `KPY-${Date.now()}`,
          destination: {
            type: 'bank_account',
            amount: params.amount,
            currency: params.currency,
            narration: params.narration || 'Withdrawal from TrustBank',
            bank_account: {
              bank: params.bankCode,
              account: params.accountNumber
            },
            customer: {
              name: params.accountName,
              email: 'support@trustbank.tech', // We'll update this with user's email later
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Korapay transfer error:', error);
        throw new Error(error.message || error.error || 'Failed to initiate transfer');
      }

      const data = await response.json();

      // Save transfer to database
      await this.saveTransferToDatabase({
        userId: params.userId,
        reference: data.data.reference,
        amount: params.amount,
        currency: params.currency,
        bankCode: params.bankCode,
        accountNumber: params.accountNumber,
        accountName: params.accountName,
        status: data.data.status,
        responseData: data.data,
      });

      return data;
    } catch (error) {
      console.error('Transfer error:', error);
      throw error;
    }
  },

  async verifyTransfer(reference: string) {
    const response = await fetch(`${KORAPAY_API_URL}/transactions/${reference}`, {
      headers: {
        'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify transfer');
    }

    const data = await response.json();

    // Update transfer status in database
    if (data.data) {
      await supabase
        .from('korapay_transfers')
        .update({ 
          status: data.data.status,
          response_data: data.data,
          updated_at: new Date().toISOString()
        })
        .eq('reference', reference);
    }

    return data;
  },

  async getBanks() {
    try {
      const response = await fetch(`${KORAPAY_API_URL}/banks`, {
        headers: {
          'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error fetching banks:', error);
        return {
          status: false,
          message: error.message || 'Failed to fetch banks',
          data: MOCK_BANKS, // Fallback to mock data if API fails
        };
      }

      const data = await response.json();
      return {
        status: true,
        data: data.data.map((bank: any) => ({
          code: bank.code,
          name: bank.name,
          slug: bank.slug,
        })),
      };
    } catch (error) {
      console.error('Error fetching banks:', error);
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Failed to fetch banks',
        data: MOCK_BANKS, // Fallback to mock data if API fails
      };
    }
  },

  async verifyAccount(bankCode: string, accountNumber: string) {
    try {
      // For test mode, we'll use a mock response
      if (KORAPAY_SECRET_KEY?.startsWith('sk_test_')) {
        console.log('Using test mode for account verification');
        return {
          status: true,
          data: {
            account_name: 'Test Account Name',
            account_number: accountNumber,
            bank_name: MOCK_BANKS.find(b => b.code === bankCode)?.name || 'Test Bank',
          },
        };
      }

      const response = await fetch(`${KORAPAY_API_URL}/bank-accounts/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
        },
        body: JSON.stringify({
          bank_code: bankCode,
          account_number: accountNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Account verification error:', error);
        return {
          status: false,
          message: error.message || 'Failed to verify account',
          data: {
            account_name: '',
            account_number: accountNumber,
            bank_name: MOCK_BANKS.find(b => b.code === bankCode)?.name || 'Unknown Bank',
          },
        };
      }

      const data = await response.json();
      return {
        status: true,
        data: {
          account_name: data.data.account_name,
          account_number: data.data.account_number,
          bank_name: data.data.bank_name,
        },
      };
    } catch (error) {
      console.error('Account verification error:', error);
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Failed to verify account',
        data: {
          account_name: '',
          account_number: accountNumber,
          bank_name: MOCK_BANKS.find(b => b.code === bankCode)?.name || 'Unknown Bank',
        },
      };
    }
  },

  async saveTransferToDatabase(params: {
    userId: string;
    reference: string;
    amount: number;
    currency: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    status: string;
    responseData: any;
  }) {
    const { data, error } = await supabase
      .from('korapay_transfers')
      .insert({
        user_id: params.userId,
        reference: params.reference,
        amount: params.amount,
        currency: params.currency,
        bank_code: params.bankCode,
        account_number: params.accountNumber,
        account_name: params.accountName,
        status: params.status,
        response_data: params.responseData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTransferHistory(userId: string, limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from('korapay_transfers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },
}; 