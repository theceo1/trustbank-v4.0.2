'use client';

import { WalletList } from './WalletList';
import { Wallet, MarketData } from '@/types/wallet';
import { useState } from 'react';

interface WalletListWrapperProps {
  wallets: Wallet[];
  marketData: MarketData[];
  userId: string;
}

export function WalletListWrapper({ wallets, marketData, userId }: WalletListWrapperProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeposit = (wallet: Wallet) => {
    console.log('Deposit', wallet);
  };

  const handleWithdraw = (wallet: Wallet) => {
    console.log('Withdraw', wallet);
  };

  const handleSwap = (wallet: Wallet) => {
    console.log('Swap', wallet);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <WalletList
      wallets={wallets}
      marketData={marketData}
      isLoading={false}
      onDeposit={handleDeposit}
      onWithdraw={handleWithdraw}
      onSwap={handleSwap}
      searchQuery={searchQuery}
      onSearch={handleSearch}
      userId={userId}
    />
  );
} 