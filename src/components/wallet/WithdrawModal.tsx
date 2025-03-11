import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/ui/icons';
import { quidaxService } from '@/lib/quidax';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string;
  currency: string;
  balance: string;
  userId: string;
}

const withdrawSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)), 'Amount must be a number')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0'),
  address: z.string().min(1, 'Withdrawal address is required'),
});

type WithdrawFormData = z.infer<typeof withdrawSchema>;

export function WithdrawModal({
  isOpen,
  onClose,
  walletId,
  currency,
  balance,
  userId,
}: WithdrawModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawSchema),
  });

  const onSubmit = async (data: WithdrawFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate withdrawal amount against balance
      if (parseFloat(data.amount) > parseFloat(balance)) {
        throw new Error('Insufficient balance');
      }

      // Create withdrawal request
      const withdrawal = await quidaxService.createWithdrawal(userId, {
        currency: currency.toLowerCase(),
        amount: data.amount,
        address: data.address,
      });

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        wallet_id: walletId,
        type: 'withdrawal',
        amount: parseFloat(data.amount),
        currency: currency,
        status: 'pending',
        quidax_transaction_id: withdrawal.id,
      });

      reset();
      onClose();
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Withdraw {currency}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <Icons.close className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              {...register('amount')}
              type="number"
              step="any"
              placeholder={`Enter ${currency} amount`}
              disabled={isLoading}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Available balance: {balance} {currency}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {currency === 'NGN' ? 'Bank Account Number' : 'Withdrawal Address'}
            </label>
            <Input
              {...register('address')}
              type="text"
              placeholder={
                currency === 'NGN'
                  ? 'Enter bank account number'
                  : `Enter ${currency} address`
              }
              disabled={isLoading}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex space-x-2">
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Withdraw'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 