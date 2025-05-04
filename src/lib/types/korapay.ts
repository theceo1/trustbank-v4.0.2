export interface KorapayConfig {
  amount: number;
  currency: string;
  reference: string;
  beneficiary: {
    account_number: string;
    bank_code: string;
    name?: string;
  };
  narration?: string;
  metadata?: Record<string, any>;
}

export interface KorapayTransferResponse {
  status: string;
  message: string;
  data: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    beneficiary: {
      account_number: string;
      bank_code: string;
      name: string;
    };
    created_at: string;
    updated_at: string;
  };
}

export interface KorapayBankAccount {
  status: string;
  message: string;
  data: {
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
  };
}

export interface KorapayBankListResponse {
  status: string;
  message: string;
  data: Array<{
    code: string;
    name: string;
    slug: string;
  }>;
} 