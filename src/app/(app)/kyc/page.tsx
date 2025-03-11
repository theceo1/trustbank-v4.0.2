'use client';

import { useState } from 'react';
import { KYCStatus } from '@/components/kyc/KYCStatus';
import { KYCVerificationForm } from '@/components/kyc/KYCVerificationForm';

export default function KYCPage() {
  const [verificationLevel, setVerificationLevel] = useState<'basic' | 'intermediate' | 'advanced' | null>(null);

  const handleStartVerification = (level: 'basic' | 'intermediate' | 'advanced') => {
    setVerificationLevel(level);
  };

  const handleCompleteVerification = () => {
    setVerificationLevel(null);
  };

  const handleCancelVerification = () => {
    setVerificationLevel(null);
  };

  return (
    <div className="container mx-auto py-6">
      {verificationLevel ? (
        <KYCVerificationForm
          level={verificationLevel}
          onComplete={handleCompleteVerification}
          onCancel={handleCancelVerification}
        />
      ) : (
        <KYCStatus onStartVerification={handleStartVerification} />
      )}
    </div>
  );
} 