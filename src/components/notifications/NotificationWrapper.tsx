import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { NotificationCenter } from './NotificationCenter';
import { Permission, hasPermission } from '@/lib/rbac';

export function NotificationWrapper() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const hasAdminAccess = await hasPermission(
        session.user.id,
        Permission.VIEW_ADMIN_DASHBOARD
      );

      setIsAdmin(hasAdminAccess);
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <NotificationCenter
      isAdmin={isAdmin}
      queryParams={{
        ...(isAdmin ? {} : { is_admin_notification: false })
      }}
    />
  );
} 