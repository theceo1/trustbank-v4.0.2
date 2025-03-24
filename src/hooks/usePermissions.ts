import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Permission, UserRole, getUserRole, hasPermission, hasAllPermissions, hasAnyPermission } from '@/lib/rbac';

export function usePermissions() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const role = await getUserRole(user.id);
          setUserRole(role);
        } catch (error) {
          console.error('Error fetching user role:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setUserRole(UserRole.USER);
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return {
    loading,
    userRole,
    can: (permission: Permission) => hasPermission(userRole, permission),
    canAll: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    canAny: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    isAdmin: () => userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN,
    isSuperAdmin: () => userRole === UserRole.SUPER_ADMIN,
    isVerified: () => userRole === UserRole.VERIFIED_USER || userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN,
  };
} 