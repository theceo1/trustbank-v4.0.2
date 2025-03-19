'use client';

import SwapClient from './SwapClient';
import { useKycStatus } from '@/hooks/useKycStatus';

export default function SwapPage() {
  const { hasBasicKyc, loading: kycLoading } = useKycStatus();

  return <SwapClient disabled={!hasBasicKyc || kycLoading} />;
} 