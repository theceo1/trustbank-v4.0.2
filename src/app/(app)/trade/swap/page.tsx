import { Metadata } from 'next';
import SwapClient from './SwapClient';

export const metadata: Metadata = {
  title: 'Swap Trading | TrustBank',
  description: 'Instantly swap between different cryptocurrencies at the best rates.',
};

export default function SwapPage() {
  return <SwapClient />;
} 