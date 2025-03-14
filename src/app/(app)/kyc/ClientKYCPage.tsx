'use client';

import { useState } from 'react';
import { KYCVerificationForm } from '@/components/kyc/KYCVerificationForm';
import { KYCStatus } from '@/components/kyc/KYCStatus';
import { useRouter } from 'next/navigation';

export default function ClientKYCPage() {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'basic' | 'intermediate' | 'advanced' | null>(null);

  const handleStartVerification = (level: 'basic' | 'intermediate' | 'advanced') => {
    setSelectedLevel(level);
  };

  const handleComplete = () => {
    setIsCompleted(true);
    router.refresh();
  };

  const handleCancel = () => {
    setSelectedLevel(null);
  };

  if (isCompleted) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Verification Submitted!</h2>
        <p className="mb-4">Your verification is being processed. We'll notify you once it's complete.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {selectedLevel ? (
        <KYCVerificationForm
          level={selectedLevel}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      ) : (
        <KYCStatus
          onStartVerification={handleStartVerification}
        />
      )}
    </div>
  );
} 