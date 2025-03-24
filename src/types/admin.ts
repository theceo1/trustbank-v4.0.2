import { Permission } from '@/lib/rbac';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions: Permission[];
  created_at: string;
}

export interface AdminState {
  user: AdminUser | null;
  permissions: Permission[];
  isLoading: boolean;
}

export interface KYCSubmission {
  id: string;
  user_profile_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  document_type: string;
  document_urls: string[];
  user_profiles: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
  };
} 