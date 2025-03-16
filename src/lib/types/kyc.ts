export type KYCTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

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
  dailyLimit: number;
  monthlyLimit: number;
  withdrawalLimit: number;
}

export interface KYCRequirements {
  TIER_1: {
    name: 'Basic';
    requirements: ['Email Verification', 'Phone Verification'];
    limits: {
      dailyLimit: 100000; // 100k NGN
      monthlyLimit: 500000; // 500k NGN
      withdrawalLimit: 200000; // 200k NGN
    };
  };
  TIER_2: {
    name: 'Intermediate';
    requirements: ['NIN Verification', 'Selfie Verification'];
    limits: {
      dailyLimit: 1000000; // 1M NGN
      monthlyLimit: 5000000; // 5M NGN
      withdrawalLimit: 2000000; // 2M NGN
    };
  };
  TIER_3: {
    name: 'Advanced';
    requirements: ['BVN Verification', 'ID Document Verification', 'Address Verification'];
    limits: {
      dailyLimit: 10000000; // 10M NGN
      monthlyLimit: 50000000; // 50M NGN
      withdrawalLimit: 20000000; // 20M NGN
    };
  };
}

export interface DojahNINVerifyRequest {
  nin: string;
  selfie_image: string;
  first_name?: string;
  last_name?: string;
}

export interface DojahBVNVerifyRequest {
  bvn: string;
  first_name?: string;
  last_name?: string;
  dob?: string;
}

export interface DojahPhotoIDVerifyRequest {
  selfie_image: string;
  photoid_image: string;
  first_name?: string;
  last_name?: string;
}

export interface DojahVerificationResponse {
  entity: {
    selfie_verification?: {
      confidence_value: number;
      match: boolean;
    };
    first_name?: {
      confidence_value: number;
      match: boolean;
    };
    last_name?: {
      confidence_value: number;
      match: boolean;
    };
  };
}

export interface KYCVerificationStatus {
  status: 'pending' | 'completed' | 'failed';
  tier: KYCTier;
  reference_id: string;
  verification_type: string;
  verification_data: any;
  created_at: string;
  updated_at: string;
} 