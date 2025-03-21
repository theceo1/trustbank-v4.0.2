import { render, screen, act, waitFor } from '@testing-library/react';
import { WalletCard } from '../WalletCard';
import { TransactionHistory } from '../TransactionHistory';
import { BalanceProvider } from '../BalanceContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn()
}));

describe('Wallet UI Update Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Supabase client implementation
    (createClientComponentClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      data: [],
      error: null
    });
  });

  describe('WalletCard Updates', () => {
    it('should update balance when props change', () => {
      const { rerender } = render(
        <BalanceProvider>
          <WalletCard
            currency="USDT"
            balance="0.4"
            price={1}
          />
        </BalanceProvider>
      );

      // Initial balance check
      expect(screen.getByText('0.40')).toBeInTheDocument();

      // Update balance
      rerender(
        <BalanceProvider>
          <WalletCard
            currency="USDT"
            balance="0.3"
            price={1}
          />
        </BalanceProvider>
      );

      // Check if balance updated
      expect(screen.getByText('0.30')).toBeInTheDocument();
    });

    it('should update new currency balance when added', () => {
      const { rerender } = render(
        <BalanceProvider>
          <WalletCard
            currency="SOL"
            balance="0"
            price={100}
          />
        </BalanceProvider>
      );

      // Initial balance check
      expect(screen.getByText('0.00')).toBeInTheDocument();

      // Update with new balance
      rerender(
        <BalanceProvider>
          <WalletCard
            currency="SOL"
            balance="0.000733"
            price={100}
          />
        </BalanceProvider>
      );

      // Check if new currency balance is shown
      expect(screen.getByText('0.000733')).toBeInTheDocument();
    });
  });

  describe('TransactionHistory Updates', () => {
    const mockTransactions = [
      {
        id: '1',
        type: 'swap',
        from_currency: 'USDT',
        to_currency: 'SOL',
        from_amount: 0.1,
        to_amount: 0.000733,
        status: 'completed',
        created_at: new Date().toISOString()
      }
    ];

    it('should show new transactions when they occur', async () => {
      const { rerender } = render(
        <TransactionHistory transactions={[]} />
      );

      // Initially no transactions
      expect(screen.getByText('No recent transactions')).toBeInTheDocument();

      // Add new transaction
      rerender(
        <TransactionHistory transactions={mockTransactions} />
      );

      // Check if new transaction is shown
      await waitFor(() => {
        expect(screen.getByText('0.1 USDT → 0.000733 SOL')).toBeInTheDocument();
        expect(screen.getByText('completed')).toBeInTheDocument();
      });
    });

    it('should update transaction status when it changes', async () => {
      const pendingTransaction = [{
        ...mockTransactions[0],
        status: 'pending'
      }];

      const { rerender } = render(
        <TransactionHistory transactions={pendingTransaction} />
      );

      // Check initial pending status
      expect(screen.getByText('pending')).toBeInTheDocument();

      // Update to completed
      rerender(
        <TransactionHistory transactions={mockTransactions} />
      );

      // Check if status updated
      await waitFor(() => {
        expect(screen.getByText('completed')).toBeInTheDocument();
      });
    });
  });
}); 