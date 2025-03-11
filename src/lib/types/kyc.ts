export type KYCTier = 'basic' | 'intermediate' | 'advanced';

export type KYCStatus = 'pending' | 'verified' | 'rejected';

export type VerificationStatus = 'Ongoing' | 'Completed' | 'Pending' | 'Failed';

export interface KYCRecord {
  id: string;
  user_id: string;
  tier: KYCTier;
  status: KYCStatus;
  verification_status: VerificationStatus;
  verification_data?: any;
  created_at: string;
  updated_at?: string;
}

interface VerificationResult {
  status: 'success' | 'failed';
  message?: string;
}

interface VerificationConfidence {
  confidence_value: number;
  match: boolean;
}

export interface NINVerificationResponse {
  entity: {
    nin: string;
    firstname?: string;
    lastname?: string;
    birthdate?: string;
    phone?: string;
    selfie_verification?: VerificationConfidence;
  };
  verification: VerificationResult;
}

export interface BVNVerificationResponse {
  entity: {
    bvn: string;
    firstname?: string;
    lastname?: string;
    birthdate?: string;
    phone?: string;
    verification?: {
      status: boolean;
      confidence_value: number;
    };
  };
  verification: VerificationResult;
}

export interface PhotoIDVerificationResponse {
  entity: {
    document_type?: string;
    document_number?: string;
    firstname?: string;
    lastname?: string;
    expiry_date?: string;
    selfie_verification?: VerificationConfidence;
  };
  verification: VerificationResult;
}

export interface KYCLimits {
  basic: {
    daily: number;
    monthly: number;
  };
  intermediate: {
    daily: number;
    monthly: number;
  };
  advanced: {
    daily: number;
    monthly: number;
  };
} 