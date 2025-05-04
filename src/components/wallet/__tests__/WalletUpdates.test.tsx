import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import WalletUpdates from '../WalletUpdates';

// Mock Supabase client
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: vi.fn(),
}));

describe('WalletUpdates Component', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClientComponentClient as any).mockReturnValue(mockSupabase);
  });

  it('should render wallet balance', () => {
    render(<WalletUpdates balance={1000} currency="NGN" />);
    expect(screen.getByText(/1,000/)).toBeInTheDocument();
    expect(screen.getByText(/NGN/)).toBeInTheDocument();
  });

  it('should handle deposit button click', () => {
    const onDeposit = vi.fn();
    render(<WalletUpdates balance={1000} currency="NGN" onDeposit={onDeposit} />);
    
    fireEvent.click(screen.getByText(/Deposit/));
    expect(onDeposit).toHaveBeenCalled();
  });

  it('should handle withdraw button click', () => {
    const onWithdraw = vi.fn();
    render(<WalletUpdates balance={1000} currency="NGN" onWithdraw={onWithdraw} />);
    
    fireEvent.click(screen.getByText(/Withdraw/));
    expect(onWithdraw).toHaveBeenCalled();
  });

  it('should display transaction history', async () => {
    const mockTransactions = [
      { id: 1, type: 'deposit', amount: 500, status: 'completed', created_at: new Date().toISOString() },
      { id: 2, type: 'withdrawal', amount: 200, status: 'pending', created_at: new Date().toISOString() },
    ];

    mockSupabase.from().select.mockResolvedValueOnce({
      data: mockTransactions,
      error: null,
    });

    render(<WalletUpdates balance={1000} currency="NGN" />);

    // Wait for transactions to load
    expect(await screen.findByText(/500/)).toBeInTheDocument();
    expect(await screen.findByText(/200/)).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    render(<WalletUpdates balance={1000} currency="NGN" isLoading={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    const error = 'Failed to load wallet data';
    render(<WalletUpdates balance={0} currency="NGN" error={error} />);
    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('should format currency correctly', () => {
    render(<WalletUpdates balance={1234567.89} currency="NGN" />);
    expect(screen.getByText(/1,234,567.89/)).toBeInTheDocument();
  });

  it('should disable buttons when processing', () => {
    render(<WalletUpdates balance={1000} currency="NGN" isProcessing={true} />);
    expect(screen.getByText(/Deposit/).closest('button')).toBeDisabled();
    expect(screen.getByText(/Withdraw/).closest('button')).toBeDisabled();
  });
}); 