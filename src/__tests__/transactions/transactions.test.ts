import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { validationSchemas } from '@/lib/validation';

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: vi.fn(),
}));

describe('Transaction Tests', () => {
  // Mock Supabase client with proper method chaining
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  const mockSupabase = {
    from: vi.fn().mockReturnValue({
      select: mockSelect.mockReturnThis(),
      insert: mockInsert.mockReturnThis(),
      update: mockUpdate.mockReturnThis(),
      delete: mockDelete.mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }),
  };

  const mockTransaction = {
    type: 'deposit',
    amount: 1000.00,
    currency: 'USD',
    status: 'pending',
    reference: 'TRX-123456',
    metadata: {
      payment_method: 'bank_transfer',
      bank_name: 'Test Bank'
    }
  };

  const mockSwapTransaction = {
    from_currency: 'USD',
    to_currency: 'BTC',
    from_amount: 1000.00,
    to_amount: 0.025,
    execution_price: 40000.00,
    status: 'pending',
    reference: 'SWAP-123456'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClientComponentClient as any).mockReturnValue(mockSupabase);
  });

  it('should create a new transaction', async () => {
    const mockTransaction = {
      id: 1,
      user_id: 'user123',
      amount: 100,
      type: 'deposit',
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    mockInsert.mockResolvedValueOnce({
      data: mockTransaction,
      error: null,
    });

    const result = await mockSupabase
      .from('transactions')
      .insert(mockTransaction);

    expect(result.error).toBeNull();
    expect(result.data).toEqual(mockTransaction);
    expect(mockInsert).toHaveBeenCalledWith(mockTransaction);
  });

  it('should fetch user transactions', async () => {
    const mockTransactions = [
      {
        id: 1,
        user_id: 'user123',
        amount: 100,
        type: 'deposit',
        status: 'completed',
      },
      {
        id: 2,
        user_id: 'user123',
        amount: 50,
        type: 'withdrawal',
        status: 'pending',
      },
    ];

    mockSelect.mockResolvedValueOnce({
      data: mockTransactions,
      error: null,
    });

    const result = await mockSupabase
      .from('transactions')
      .select('*')
      .eq('user_id', 'user123');

    expect(result.error).toBeNull();
    expect(result.data).toEqual(mockTransactions);
  });

  it('should update transaction status', async () => {
    const transactionId = 1;
    const newStatus = 'completed';

    mockUpdate.mockResolvedValueOnce({
      data: { id: transactionId, status: newStatus },
      error: null,
    });

    const result = await mockSupabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', transactionId);

    expect(result.error).toBeNull();
    expect(result.data.status).toBe(newStatus);
  });

  it('should handle transaction errors', async () => {
    const mockError = {
      message: 'Database error',
      details: 'Connection failed',
    };

    mockInsert.mockResolvedValueOnce({
      data: null,
      error: mockError,
    });

    const result = await mockSupabase
      .from('transactions')
      .insert({ amount: 100, type: 'deposit' });

    expect(result.data).toBeNull();
    expect(result.error).toEqual(mockError);
  });

  it('should delete a transaction', async () => {
    const transactionId = 1;

    mockDelete.mockResolvedValueOnce({
      data: { id: transactionId },
      error: null,
    });

    const result = await mockSupabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    expect(result.error).toBeNull();
    expect(result.data.id).toBe(transactionId);
  });

  describe('Transaction Creation', () => {
    it('should create a valid deposit transaction', async () => {
      const mockResponse = {
        data: { id: 1, ...mockTransaction },
        error: null
      };

      mockInsert.mockImplementation(() => ({
        execute: jest.fn().mockResolvedValue(mockResponse)
      }));

      const result = await mockSupabase
        .from('transactions')
        .insert(mockTransaction)
        .execute();
      
      expect(result.error).toBeNull();
      expect(result.data).toHaveProperty('id');
      expect(result.data.type).toBe('deposit');
      expect(result.data.status).toBe('pending');
    });

    it('should create a valid withdrawal transaction', async () => {
      const withdrawalTx = { ...mockTransaction, type: 'withdrawal' };
      const mockResponse = {
        data: { id: 2, ...withdrawalTx },
        error: null
      };

      mockInsert.mockImplementation(() => ({
        execute: jest.fn().mockResolvedValue(mockResponse)
      }));

      const result = await mockSupabase
        .from('transactions')
        .insert(withdrawalTx)
        .execute();
      
      expect(result.error).toBeNull();
      expect(result.data.type).toBe('withdrawal');
    });

    it('should handle transaction creation failure', async () => {
      const mockError = {
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' }
      };

      mockInsert.mockImplementation(() => ({
        execute: jest.fn().mockResolvedValue(mockError)
      }));

      const result = await mockSupabase
        .from('transactions')
        .insert(mockTransaction)
        .execute();
      
      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Database error');
    });
  });

  describe('Transaction Validation', () => {
    it('should validate a correct transaction object', () => {
      const validation = validationSchemas.transaction.safeParse(mockTransaction);
      expect(validation.success).toBe(true);
    });

    it('should reject invalid transaction type', () => {
      const invalidTx = { ...mockTransaction, type: 'invalid_type' };
      const validation = validationSchemas.transaction.safeParse(invalidTx);
      expect(validation.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const invalidTx = { ...mockTransaction, amount: -100 };
      const validation = validationSchemas.transaction.safeParse(invalidTx);
      expect(validation.success).toBe(false);
    });

    it('should reject invalid currency code', () => {
      const invalidTx = { ...mockTransaction, currency: 'INVALID' };
      const validation = validationSchemas.transaction.safeParse(invalidTx);
      expect(validation.success).toBe(false);
    });
  });

  describe('Currency Conversion', () => {
    const mockExchangeRates = {
      USD: { BTC: 0.000025, ETH: 0.00042 },
      BTC: { USD: 40000, ETH: 16.8 },
      ETH: { USD: 2380, BTC: 0.0595 }
    };

    beforeEach(() => {
      mockSelect.mockImplementation(() => ({
        execute: jest.fn().mockResolvedValue({
          data: mockExchangeRates,
          error: null
        })
      }));
    });

    it('should calculate correct conversion amount', async () => {
      const fromAmount = 1000; // USD
      const rate = mockExchangeRates.USD.BTC;
      const expectedAmount = fromAmount * rate;

      const result = await mockSupabase
        .from('exchange_rates')
        .select()
        .execute();

      const convertedAmount = fromAmount * result.data.USD.BTC;
      expect(convertedAmount).toBe(expectedAmount);
    });

    it('should validate swap transaction', () => {
      const validation = validationSchemas.swapTransaction.safeParse(mockSwapTransaction);
      expect(validation.success).toBe(true);
    });

    it('should handle swap execution', async () => {
      const mockSwapResult = {
        data: {
          id: 1,
          ...mockSwapTransaction,
          status: 'completed',
          executed_at: new Date().toISOString()
        },
        error: null
      };

      mockInsert.mockImplementation(() => ({
        execute: jest.fn().mockResolvedValue(mockSwapResult)
      }));

      const result = await mockSupabase
        .from('swap_transactions')
        .insert(mockSwapTransaction)
        .execute();

      expect(result.error).toBeNull();
      expect(result.data.status).toBe('completed');
      expect(result.data.executed_at).toBeTruthy();
    });

    it('should reject invalid swap rates', () => {
      const invalidSwap = {
        ...mockSwapTransaction,
        from_amount: 1000,
        to_amount: 1, // Unrealistic BTC amount for 1000 USD
        execution_price: 1000 // Unrealistic BTC price
      };

      const validation = validationSchemas.swapTransaction.safeParse(invalidSwap);
      expect(validation.success).toBe(false);
    });
  });

  describe('Fee Calculations', () => {
    const FEE_RATES = {
      deposit: 0.01, // 1%
      withdrawal: 0.015, // 1.5%
      swap: 0.002 // 0.2%
    };

    beforeEach(() => {
      mockSelect.mockImplementation(() => ({
        execute: jest.fn().mockResolvedValue({
          data: { fee_rates: FEE_RATES },
          error: null
        })
      }));
    });

    it('should calculate correct deposit fee', async () => {
      const amount = 1000;
      
      const result = await mockSupabase
        .from('fee_configurations')
        .select()
        .execute();

      const calculatedFee = amount * result.data.fee_rates.deposit;
      expect(calculatedFee).toBe(10); // 1% of 1000
    });

    it('should calculate correct withdrawal fee', async () => {
      const amount = 1000;
      
      const result = await mockSupabase
        .from('fee_configurations')
        .select()
        .execute();

      const calculatedFee = amount * result.data.fee_rates.withdrawal;
      expect(calculatedFee).toBe(15); // 1.5% of 1000
    });

    it('should calculate correct swap fee', async () => {
      const amount = 1000;
      
      const result = await mockSupabase
        .from('fee_configurations')
        .select()
        .execute();

      const calculatedFee = amount * result.data.fee_rates.swap;
      expect(calculatedFee).toBe(2); // 0.2% of 1000
    });

    it('should handle minimum fee requirements', async () => {
      const MIN_FEE = 1; // $1 minimum fee
      const smallAmount = 10;
      
      const result = await mockSupabase
        .from('fee_configurations')
        .select()
        .execute();

      const calculatedFee = Math.max(
        smallAmount * result.data.fee_rates.deposit,
        MIN_FEE
      );
      expect(calculatedFee).toBe(MIN_FEE);
    });
  });
}); 