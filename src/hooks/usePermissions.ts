import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Permission, UserRole, getUserRoleAndPermissions } from '@/lib/rbac';

// Define role-based permissions
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [],
  [UserRole.VERIFIED_USER]: [Permission.SUBMIT_KYC, Permission.VIEW_WALLET, Permission.CREATE_TRANSACTION],
  [UserRole.ADMIN]: [
    Permission.VIEW_USERS,
    Permission.MANAGE_USERS,
    Permission.VIEW_TRANSACTIONS,
    Permission.APPROVE_TRANSACTION,
    Permission.VIEW_WALLET,
    Permission.MANAGE_WALLET,
    Permission.APPROVE_KYC,
    Permission.VIEW_ADMIN_DASHBOARD,
    Permission.VIEW_LOGS
  ],
  [UserRole.SUPER_ADMIN]: Object.values(Permission)
};

export function usePermissions() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const { role, permissions: userPermissions } = await getUserRoleAndPermissions(user.id);
          setUserRole(role as UserRole);
          setPermissions(userPermissions);
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole(UserRole.USER);
          setPermissions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setUserRole(UserRole.USER);
        setPermissions([]);
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const can = (permission: Permission): boolean => {
    return permissions.includes(permission) || rolePermissions[userRole]?.includes(permission) || false;
  };

  const canAll = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(permission => can(permission));
  };

  const canAny = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => can(permission));
  };

  return {
    loading,
    userRole,
    permissions,
    can,
    canAll,
    canAny,
    isAdmin: () => userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN,
    isSuperAdmin: () => userRole === UserRole.SUPER_ADMIN,
    isVerified: () => userRole === UserRole.VERIFIED_USER || userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN,
  };
} 