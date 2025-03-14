'use client';

import { WalletList } from './WalletList';
import { Wallet, MarketData } from '@/types/wallet';
import { useState } from 'react';

interface WalletListWrapperProps {
  wallets: Wallet[];
  marketData: MarketData[];
  userId: string;
  onDeposit?: (wallet: Wallet) => void;
  onWithdraw?: (wallet: Wallet) => void;
  onSwap?: (wallet: Wallet) => void;
}

export function WalletListWrapper({ 
  wallets, 
  marketData, 
  userId,
  onDeposit,
  onWithdraw,
  onSwap,
}: WalletListWrapperProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <WalletList
      wallets={wallets}
      marketData={marketData}
      isLoading={false}
      searchQuery={searchQuery}
      onSearch={handleSearch}
      userId={userId}
      onDeposit={onDeposit}
      onWithdraw={onWithdraw}
      onSwap={onSwap}
    />
  );
} 