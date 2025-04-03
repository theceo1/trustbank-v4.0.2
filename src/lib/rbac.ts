import { User } from '@supabase/auth-helpers-nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export enum UserRole {
  USER = 'user',
  VERIFIED_USER = 'verified_user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // User management
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  
  // Transaction permissions
  VIEW_TRANSACTIONS = 'view_transactions',
  CREATE_TRANSACTION = 'create_transaction',
  APPROVE_TRANSACTION = 'approve_transaction',
  
  // Wallet permissions
  VIEW_WALLET = 'view_wallet',
  MANAGE_WALLET = 'manage_wallet',
  WITHDRAW = 'withdraw',
  
  // KYC permissions
  SUBMIT_KYC = 'submit_kyc',
  APPROVE_KYC = 'approve_kyc',
  
  // Admin permissions
  VIEW_ADMIN_DASHBOARD = 'view_admin_dashboard',
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_LOGS = 'view_logs',
  
  // Special permissions
  ALL = 'all'
}

interface DatabaseRole {
  name: string;
  permissions: Permission[];
}

interface DatabaseResponse {
  admin_roles: DatabaseRole;
}

// Function to get user role and permissions from Supabase
export const getUserRoleAndPermissions = async (userId: string): Promise<{ role: UserRole; permissions: Permission[] }> => {
  const supabase = createClientComponentClient();
  
  const { data, error } = await supabase
    .from('admin_users')
    .select(`
      admin_roles (
        name,
        permissions
      )
    `)
    .eq('user_id', userId)
    .single();
    
  if (error || !data?.admin_roles) {
    console.error('Error fetching user role:', error);
    return { 
      role: UserRole.USER,
      permissions: [] 
    };
  }

  // Handle the array response from Supabase
  const roleData = Array.isArray(data.admin_roles) ? data.admin_roles[0] : data.admin_roles;

  return {
    role: roleData.name as UserRole,
    permissions: roleData.permissions || []
  };
};

// Function to check if user has specific permission
export const hasPermission = async (userId: string, permission: Permission): Promise<boolean> => {
  const { permissions } = await getUserRoleAndPermissions(userId);
  return permissions.includes(permission);
};

// Function to check if user has any of the required permissions
export const hasAnyPermission = async (userId: string, requiredPermissions: Permission[]): Promise<boolean> => {
  const { permissions } = await getUserRoleAndPermissions(userId);
  return requiredPermissions.some(p => permissions.includes(p));
};

// Function to check if user has all of the required permissions
export const hasAllPermissions = async (userId: string, requiredPermissions: Permission[]): Promise<boolean> => {
  const { permissions } = await getUserRoleAndPermissions(userId);
  return requiredPermissions.every(p => permissions.includes(p));
};

// Function to get permissions required for a route
export const getRoutePermissions = (path: string): Permission[] => {
  const adminRoutes: Record<string, Permission[]> = {
    '/admin': [Permission.VIEW_ADMIN_DASHBOARD],
    '/admin/users': [Permission.VIEW_USERS],
    '/admin/transactions': [Permission.VIEW_TRANSACTIONS],
    '/admin/wallets': [Permission.MANAGE_WALLET],
    '/admin/settings': [Permission.MANAGE_SETTINGS],
  };

  return adminRoutes[path] || [];
}; 