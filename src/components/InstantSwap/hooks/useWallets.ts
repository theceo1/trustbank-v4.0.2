import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/hooks/use-toast';
import { WalletType } from '../types';

export const useWallets = () => {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const fetchWallets = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch wallets');
      const data = await response.json();
      
      // Filter wallets to only include those with positive balances
      const walletsWithBalance = data.wallets.filter(
        (w: WalletType) => parseFloat(w.balance) > 0
      );
      
      setWallets(walletsWithBalance);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet balances",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const getWalletBalance = useCallback((currency: string): string => {
    const wallet = wallets.find(w => w.currency.toLowerCase() === currency.toLowerCase());
    return wallet?.balance || '0';
  }, [wallets]);

  return {
    wallets,
    isLoading,
    refreshWallets: fetchWallets,
    getWalletBalance
  };
}; 