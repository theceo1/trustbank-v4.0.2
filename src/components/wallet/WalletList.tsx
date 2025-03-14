'use client';

import { useEffect, useState } from 'react';
import { WalletCard } from '@/components/wallet/WalletCard';
import { DepositModal } from '@/components/wallet/DepositModal';
import { WithdrawModal } from '@/components/wallet/WithdrawModal';
import { InstantSwapModal } from '@/components/InstantSwapModal';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Wallet, MarketData } from '@/types/wallet';
import { quidaxService } from '@/lib/quidax';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WalletListProps {
  wallets: Wallet[];
  marketData: MarketData[];
  isLoading: boolean;
  searchQuery: string;
  onSearch: (query: string) => void;
  userId: string;
  onDeposit?: (wallet: Wallet) => void;
  onWithdraw?: (wallet: Wallet) => void;
  onSwap?: (wallet: Wallet) => void;
}

const CORE_CURRENCIES = ['NGN', 'BTC', 'ETH', 'USDT', 'TRUMP', 'XRP'];

const WalletSkeleton = () => (
  <div className="rounded-xl border bg-card shadow-lg p-6 space-y-4 animate-pulse">
    <div className="space-y-2">
      <div className="h-4 w-24 bg-gray-700/10 dark:bg-gray-700 rounded" />
      <div className="h-6 w-32 bg-gray-700/10 dark:bg-gray-700 rounded" />
    </div>
    <div className="space-y-2">
      <div className="h-4 w-24 bg-gray-700/10 dark:bg-gray-700 rounded" />
      <div className="h-4 w-16 bg-gray-700/10 dark:bg-gray-700 rounded" />
    </div>
    <div className="grid grid-cols-3 gap-2">
      <div className="h-8 bg-gray-700/10 dark:bg-gray-700 rounded" />
      <div className="h-8 bg-gray-700/10 dark:bg-gray-700 rounded" />
      <div className="h-8 bg-gray-700/10 dark:bg-gray-700 rounded" />
    </div>
  </div>
);

export function WalletList({
  wallets,
  marketData,
  isLoading,
  searchQuery,
  onSearch,
  userId,
  onDeposit,
  onWithdraw,
  onSwap,
}: WalletListProps) {
  const { toast } = useToast();
  const [showAllWallets, setShowAllWallets] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Filter wallets based on core/all toggle and search query
  const filteredWallets = wallets
    .filter(wallet => 
      showAllWallets || CORE_CURRENCIES.includes(wallet.currency.toUpperCase())
    )
    .filter(wallet =>
      wallet.currency.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getMarketPrice = (currency: string) => {
    // For NGN, return 1 as it's the base currency
    if (currency.toUpperCase() === 'NGN') return 1;

    // Find the market data for this currency
    const market = marketData.find(m => m.currency === currency.toUpperCase());
    return market?.price || 0;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative flex items-center">
            <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search wallets..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9"
              aria-label="Search wallets"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-all-wallets"
              checked={showAllWallets}
              onCheckedChange={setShowAllWallets}
              aria-label="Toggle all wallets"
            />
            <label
              htmlFor="show-all-wallets"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show all wallets
            </label>
          </div>
        </div>
        <div className="flex items-center rounded-md border">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={view === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setView('grid')}
                  className="rounded-none rounded-l-md"
                  aria-label="Grid view"
                >
                  <Icons.grid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Grid view</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setView('list')}
                  className="rounded-none rounded-r-md"
                  aria-label="List view"
                >
                  <Icons.list className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>List view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Wallets */}
      <ScrollArea className="h-[calc(100vh-20rem)]">
        <div
          className={
            view === 'grid'
              ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-4'
          }
        >
          {isLoading
            ? Array(6)
                .fill(0)
                .map((_, i) => <WalletSkeleton key={i} />)
            : filteredWallets.map((wallet) => {
                const price = getMarketPrice(wallet.currency);
                return (
                  <WalletCard
                    key={wallet.id}
                    currency={wallet.currency}
                    balance={wallet.balance}
                    price={price}
                    onDeposit={onDeposit ? () => onDeposit(wallet) : undefined}
                    onWithdraw={onWithdraw ? () => onWithdraw(wallet) : undefined}
                    onSwap={onSwap ? () => onSwap(wallet) : undefined}
                  />
                );
              })}
        </div>
      </ScrollArea>
    </div>
  );
} 