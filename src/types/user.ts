export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    phone?: string;
    country?: string;
    address?: string;
  };
  kyc?: {
    status: 'pending' | 'verified' | 'rejected';
    submittedAt?: string;
    verifiedAt?: string;
    documents?: {
      type: string;
      url: string;
      status: 'pending' | 'verified' | 'rejected';
    }[];
  };
} 