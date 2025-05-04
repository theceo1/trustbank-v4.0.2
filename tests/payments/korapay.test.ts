import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { initiateTransfer, verifyTransfer, getBanks, getTransfers } from '@/lib/services/korapay';

// Mock Supabase client
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    execute: vi.fn().mockResolvedValue({ data: null, error: null })
  }))
}));

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_KORAPAY_PUBLIC_KEY', 'test_public_key');
vi.stubEnv('KORAPAY_SECRET_KEY', 'test_secret_key');
vi.stubEnv('NEXT_PUBLIC_KORAPAY_BASE_URL', 'https://api.korapay.com');

describe('KoraPay Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bank Account Verification', () => {
    it('should verify a valid bank account in test mode', async () => {
      const mockResponse = {
        status: true,
        data: {
          account_name: 'Test User',
          account_number: '1234567890',
          bank_code: '058'
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await verifyTransfer('test_reference');
      expect(result.status).toBe(true);
      if (result.data) {
        expect(result.data.account_name).toBe('Test User');
      }
    });

    it('should handle invalid bank account in test mode', async () => {
      const mockResponse = {
        status: false,
        message: 'Invalid account details'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await verifyTransfer('invalid_reference');
      expect(result.status).toBe(false);
      expect(result.message).toBe('Invalid account details');
    });
  });

  describe('Bank Transfer', () => {
    it('should successfully initiate a bank transfer', async () => {
      const mockResponse = {
        status: true,
        data: {
          reference: 'test_reference',
          amount: 1000,
          currency: 'NGN',
          status: 'pending'
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await initiateTransfer({
        account_number: '1234567890',
        bank_code: '058',
        amount: 1000,
        currency: 'NGN',
        narration: 'Test transfer'
      });

      expect(result.status).toBe(true);
      if (result.data) {
        expect(result.data.reference).toBe('test_reference');
      }
    });

    it('should handle insufficient funds', async () => {
      const mockResponse = {
        status: false,
        message: 'Insufficient funds'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await initiateTransfer({
        account_number: '1234567890',
        bank_code: '058',
        amount: 1000000,
        currency: 'NGN',
        narration: 'Test transfer'
      });

      expect(result.status).toBe(false);
      expect(result.message).toBe('Insufficient funds');
    });

    it('should handle invalid bank code', async () => {
      const mockResponse = {
        status: false,
        message: 'Invalid bank code'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await initiateTransfer({
        account_number: '1234567890',
        bank_code: 'invalid',
        amount: 1000,
        currency: 'NGN',
        narration: 'Test transfer'
      });

      expect(result.status).toBe(false);
      expect(result.message).toBe('Invalid bank code');
    });
  });

  describe('Transfer Verification', () => {
    it('should verify a successful transfer', async () => {
      const mockResponse = {
        status: true,
        data: {
          reference: 'test_reference',
          amount: 1000,
          currency: 'NGN',
          status: 'success'
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await verifyTransfer('test_reference');
      expect(result.status).toBe(true);
      if (result.data) {
        expect(result.data.status).toBe('success');
      }
    });

    it('should handle failed transfer verification', async () => {
      const mockResponse = {
        status: false,
        message: 'Transfer not found'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await verifyTransfer('invalid_reference');
      expect(result.status).toBe(false);
      expect(result.message).toBe('Transfer not found');
    });
  });

  describe('Bank List', () => {
    it('should fetch the list of supported banks', async () => {
      const mockResponse = {
        status: true,
        data: [
          { code: '058', name: 'GTBank' },
          { code: '033', name: 'UBA' }
        ]
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await getBanks();
      expect(result.status).toBe(true);
      if (result.data) {
        expect(result.data.length).toBe(2);
      }
    });

    it('should handle API failure gracefully', async () => {
      const mockResponse = {
        status: false,
        message: 'API Error'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await getBanks();
      expect(result.status).toBe(false);
      expect(result.message).toBe('API Error');
    });
  });

  describe('Transfer History', () => {
    it('should fetch user transfer history', async () => {
      const mockResponse = {
        status: true,
        data: [
          {
            reference: 'ref1',
            amount: 1000,
            currency: 'NGN',
            status: 'success'
          },
          {
            reference: 'ref2',
            amount: 2000,
            currency: 'NGN',
            status: 'pending'
          }
        ]
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await getTransfers();
      expect(result.status).toBe(true);
      if (result.data) {
        expect(result.data.length).toBe(2);
      }
    });

    it('should handle pagination correctly', async () => {
      const mockResponse = {
        status: true,
        data: [
          {
            reference: 'ref1',
            amount: 1000,
            currency: 'NGN',
            status: 'success'
          }
        ],
        meta: {
          current_page: 1,
          total_pages: 2
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await getTransfers(1, 10);
      expect(result.status).toBe(true);
      if (result.data) {
        expect(result.data.length).toBe(1);
      }
      if (result.meta) {
        expect(result.meta.current_page).toBe(1);
      }
    });
  });
}); 