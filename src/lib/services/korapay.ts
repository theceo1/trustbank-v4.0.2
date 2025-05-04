import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import crypto from 'crypto';

const KORAPAY_API_URL = process.env.KORAPAY_API_URL || 'https://api.korapay.com/merchant/api/v1';
const KORAPAY_PUBLIC_KEY = process.env.KORAPAY_PUBLIC_KEY;
const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;
const KORAPAY_ENCRYPTION_KEY = process.env.KORAPAY_ENCRYPTION_KEY || '';

if (!KORAPAY_SECRET_KEY || !KORAPAY_PUBLIC_KEY || !KORAPAY_ENCRYPTION_KEY) {
  throw new Error('Korapay keys are required');
}

// Function to encrypt data
function encryptData(data: string): string {
  const iv = crypto.randomBytes(16);
  // Create a 32-byte key by hashing the original key
  const key = crypto.createHash('sha256').update(KORAPAY_ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Function to decrypt data
function decryptData(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  // Create a 32-byte key by hashing the original key
  const key = crypto.createHash('sha256').update(KORAPAY_ENCRYPTION_KEY).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const supabase = createClientComponentClient<Database>();

// Audit logging function
async function logAuditEvent(event: {
  userId: string;
  action: string;
  status: string;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: event.userId,
      action: event.action,
      status: event.status,
      details: event.details,
      ip_address: event.ip,
      user_agent: event.userAgent,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

interface TransferData {
  account_number: string;
  bank_code: string;
  amount: number;
  currency: string;
  narration: string;
}

interface TransferResponse {
  status: boolean;
  data?: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    account_name?: string;
  };
  message?: string;
}

interface BankResponse {
  status: boolean;
  data: Array<{
    code: string;
    name: string;
  }> | null;
  message?: string;
}

interface TransferHistoryResponse {
  status: boolean;
  data?: Array<{
    reference: string;
    amount: number;
    currency: string;
    status: string;
  }>;
  meta?: {
    current_page: number;
    total_pages: number;
  };
  message?: string;
}

export async function initiateTransfer(data: TransferData): Promise<TransferResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_KORAPAY_BASE_URL}/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KORAPAY_SECRET_KEY}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        status: false,
        message: result.message || 'Transfer failed'
      };
    }

    // Save transfer to database
    await supabase
      .from('korapay_transfers')
      .insert({
        user_id: 'test-user-id', // Replace with actual user ID
        reference: result.data.reference,
        amount: data.amount,
        currency: data.currency,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return result;
  } catch (error: any) {
    return {
      status: false,
      message: error.message || 'Transfer failed'
    };
  }
}

export async function verifyTransfer(reference: string): Promise<TransferResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_KORAPAY_BASE_URL}/transfers/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.KORAPAY_SECRET_KEY}`
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        status: false,
        message: result.message || 'Verification failed'
      };
    }

    // Update transfer status in database
    await supabase
      .from('korapay_transfers')
      .update({
        status: result.data.status,
        updated_at: new Date().toISOString()
      })
      .eq('reference', reference);

    return result;
  } catch (error: any) {
    return {
      status: false,
      message: error.message || 'Verification failed'
    };
  }
}

export async function getTransfers(page = 1, limit = 10): Promise<TransferHistoryResponse> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_KORAPAY_BASE_URL}/transfers?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.KORAPAY_SECRET_KEY}`
        }
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      return {
        status: false,
        message: result.message || 'Failed to fetch transfers'
      };
    }

    return result;
  } catch (error: any) {
    return {
      status: false,
      message: error.message || 'Failed to fetch transfers'
    };
  }
}

interface PaymentData {
  amount: number;
  currency: string;
  email: string;
  reference: string;
}

interface PaymentResponse {
  status: string;
  reference: string;
  message?: string;
}

export async function processKoraPayPayment(data: PaymentData): Promise<PaymentResponse> {
  // Validate currency
  if (data.currency !== 'NGN') {
    throw new Error('Invalid currency');
  }

  // Validate amount
  if (data.amount > 100000) {
    throw new Error('Insufficient funds');
  }

  try {
    const payload = {
      amount: data.amount,
      currency: data.currency,
      email: data.email,
      reference: data.reference,
    };

    // Encrypt the payload
    const encryptedPayload = encryptData(JSON.stringify(payload));

    const response = await fetch(`${KORAPAY_API_URL}/transactions/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KORAPAY_PUBLIC_KEY}`,
        'X-Encrypted-Data': encryptedPayload,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment processing failed');
    }

    const result = await response.json();
    return {
      status: 'success',
      reference: result.reference,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}

export async function initiatePayIn(
  amount: number,
  bankCode: string,
  customer: {
    name: string;
    email: string;
  },
  reference: string
): Promise<{
  status: boolean;
  message: string;
  data: any;
}> {
  try {
    const response = await fetch(`${KORAPAY_API_URL}/charge/pay-with-bank`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        amount,
        bank_code: bankCode,
        currency: 'NGN',
        reference,
        customer,
        merchant_bears_cost: true
      })
    });

    const data = await response.json();
    return {
      status: response.ok,
      message: data.message || 'Payment initiated successfully',
      data: data.data
    };
  } catch (error) {
    console.error('Error initiating payment:', error);
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Failed to initiate payment',
      data: null
    };
  }
}

export async function initiatePayout(
  amount: number,
  bankCode: string,
  accountNumber: string,
  customer: {
    name: string;
    email: string;
  },
  reference: string,
  narration?: string
): Promise<{
  status: boolean;
  message: string;
  data: any;
}> {
  try {
    const response = await fetch(`${KORAPAY_API_URL}/transactions/disburse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        reference,
        destination: {
          type: 'bank_account',
          amount,
          currency: 'NGN',
          narration: narration || 'Withdrawal from TrustBank',
          bank_account: {
            bank: bankCode,
            account: accountNumber
          },
          customer
        }
      })
    });

    const data = await response.json();
    return {
      status: response.ok,
      message: data.message || 'Payout initiated successfully',
      data: data.data
    };
  } catch (error) {
    console.error('Error initiating payout:', error);
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Failed to initiate payout',
      data: null
    };
  }
}

export async function verifyPayout(reference: string): Promise<{
  status: boolean;
  message: string;
  data: any;
}> {
  try {
    const response = await fetch(`${KORAPAY_API_URL}/transactions/${reference}`, {
      headers: {
        'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    return {
      status: response.ok,
      message: data.message || 'Payout verification successful',
      data: data.data
    };
  } catch (error) {
    console.error('Error verifying payout:', error);
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Failed to verify payout',
      data: null
    };
  }
}

export async function getPayouts(limit: number = 10): Promise<{
  status: boolean;
  message: string;
  data: any;
}> {
  try {
    const response = await fetch(`${KORAPAY_API_URL}/payouts?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    return {
      status: response.ok,
      message: data.message || 'Payouts retrieved successfully',
      data: data.data
    };
  } catch (error) {
    console.error('Error getting payouts:', error);
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Failed to get payouts',
      data: null
    };
  }
}

export async function verifyAccount(bankCode: string, accountNumber: string): Promise<{
  status: boolean;
  message?: string;
  data?: {
    account_name: string;
    account_number: string;
    bank_name: string;
  };
}> {
  try {
    if (!KORAPAY_SECRET_KEY) {
      throw new Error('KoraPay secret key is not configured');
    }

    console.log('Verifying account with KoraPay...');
    console.log('Bank Code:', bankCode);
    console.log('Account Number:', accountNumber);
    
    const response = await fetch(`${KORAPAY_API_URL}/transfers/account/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        bank_code: bankCode,
        account_number: accountNumber,
        currency: 'NGN',
        country: 'NG'
      })
    });

    const data = await response.json();
    console.log('Response from KoraPay:', data);

    if (!response.ok) {
      return {
        status: false,
        message: data.message || 'Failed to verify account'
      };
    }

    return {
      status: true,
      data: {
        account_name: data.data.account_name,
        account_number: data.data.account_number,
        bank_name: data.data.bank_name
      }
    };
  } catch (error) {
    console.error('Error verifying account:', error);
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Failed to verify account'
    };
  }
} 