import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { Permission, UserRole } from '@/lib/rbac';

interface AdminContextType {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: Permission[];
  role: UserRole | null;
  loading: boolean;
  dashboardStats: {
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    totalVolume: number;
  };
  refreshStats: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalVolume: 0,
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !session) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/auth/check');
        const data = await response.json();

        if (!data.isAdmin) {
          router.push('/');
          return;
        }

        setRole(data.role);
        setPermissions(data.permissions);
        await refreshStats();
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, session, router]);

  const refreshStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats');
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const value = {
    isAdmin: !!role && ['admin', 'super_admin'].includes(role),
    isSuperAdmin: role === 'super_admin',
    permissions,
    role,
    loading,
    dashboardStats,
    refreshStats,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}; 